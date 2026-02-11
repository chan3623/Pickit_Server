import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreatePopupReservationDto } from './dto/create-popup-reservation.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { PopupDayInfo } from './entities/popup-day-info.entity';
import { PopupReservationInfo } from './entities/popup-reservation-info.entity';
import { PopupReservation } from './entities/popup-reservation.entity';
import { Popup } from './entities/popup.entity';

@Injectable()
export class PopupService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Popup)
    private readonly popupRepository: Repository<Popup>,
    @InjectRepository(PopupDayInfo)
    private readonly popupDayInfoRepository: Repository<PopupDayInfo>,
    @InjectRepository(PopupReservation)
    private readonly popupReservationRepository: Repository<PopupReservation>,
    @InjectRepository(PopupReservationInfo)
    private readonly popupReservationInfoRepository: Repository<PopupReservationInfo>,
  ) {}

  async findAll() {
    return await this.popupRepository
      .createQueryBuilder('popup')
      .orderBy('popup.id', 'ASC')
      .getMany();
  }

  async findRandomPopups() {
    return await this.popupRepository
      .createQueryBuilder('popup')
      .orderBy('RANDOM()')
      .limit(6)
      .getMany();
  }

  async findPopupReservation(popupId: number) {
    /**
     * 1. 팝업 조회
     */
    const popup = await this.popupRepository.findOne({
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
      },
      where: { id: popupId },
    });

    if (!popup) {
      throw new NotFoundException('존재하지 않는 팝업입니다.');
    }

    /**
     * 2. 요일별 운영 정보
     */
    const dayInfos = await this.popupDayInfoRepository.find({
      where: { popupId },
      order: { dayOfWeek: 'ASC' },
    });

    if (dayInfos.length === 0) {
      throw new NotFoundException(
        '해당 팝업의 요일별 운영 정보가 존재하지 않습니다.',
      );
    }

    /**
     * 3. 예약 타임별 예약 인원 집계
     */
    const reservations = await this.popupReservationRepository
      .createQueryBuilder('reservation')
      .leftJoin('reservation.reservationInfos', 'info')
      .select([
        'reservation.popupId AS "popupId"',
        'reservation.date AS date',
        'reservation.time AS time',
        'COALESCE(SUM(info.quantity), 0) AS "reservedCount"',
      ])
      .where('reservation.popupId = :popupId', { popupId })
      .groupBy('reservation.popupId')
      .addGroupBy('reservation.date')
      .addGroupBy('reservation.time')
      .orderBy('reservation.date', 'ASC')
      .addOrderBy('reservation.time', 'ASC')
      .getRawMany();

    /**
     * 4. 응답
     */
    return {
      popup,
      dayInfos,
      reservations,
    };
  }

  async findPopupDetail(id: number) {
    const popup = await this.popupRepository.findOne({
      where: { id },
    });

    if (!popup) {
      throw new NotFoundException('존재하지 않는 ID의 팝업스토어입니다.');
    }

    const dayOfInfo = await this.popupDayInfoRepository.find({
      where: {
        popupId: id,
      },
    });

    if (!dayOfInfo) {
      throw new NotFoundException(
        '해당 팝업스토어의 요일별 시간이 존재하지 않습니다.',
      );
    }

    return {
      popup,
      dayOfInfo,
    };
  }

  async findOne(id: number) {
    const popup = await this.popupRepository.findOne({
      where: { id },
    });

    if (!popup) {
      throw new NotFoundException('존재하지 않는 popup의 ID입니다.');
    }

    return popup;
  }

  async createReservation(userId: number, dto: CreatePopupReservationDto) {
    const { popupId, date, dayOfWeek, time, phone, count } = dto;

    return await this.dataSource.transaction(
      'READ COMMITTED',
      async (manager) => {
        const dayInfo = await manager.findOne(PopupDayInfo, {
          select: { capacityPerSlot: true },
          where: { popupId, dayOfWeek },
        });

        if (!dayInfo) {
          throw new BadRequestException('잘못된 예약 정보입니다.');
        }

        await manager
          .createQueryBuilder()
          .insert()
          .into(PopupReservation)
          .values({
            popupId,
            date,
            time,
            currentCount: 0,
          })
          .orIgnore()
          .execute();

        const reservation = await manager.findOneOrFail(PopupReservation, {
          where: { popupId, date, time },
        });

        const updateResult = await manager
          .createQueryBuilder()
          .update(PopupReservation)
          .set({
            currentCount: () => `"currentCount" + ${count}`,
          })
          .where('id = :id', { id: reservation.id })
          .andWhere(`"currentCount" + :count <= :capacity`, {
            count,
            capacity: dayInfo.capacityPerSlot,
          })
          .execute();

        if (updateResult.affected === 0) {
          throw new BadRequestException(
            '예약 인원이 총 예약 가능 수를 초과했습니다.',
          );
        }

        return await manager.save(PopupReservationInfo, {
          reservationId: reservation.id,
          quantity: count,
          userId,
          reserverPhone: phone,
        });
      },
    );
  }

  update(id: number, updatePopupDto: UpdatePopupDto) {
    return `This action updates a #${id} popup`;
  }

  remove(id: number) {
    return `This action removes a #${id} popup`;
  }
}
