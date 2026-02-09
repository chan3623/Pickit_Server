import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { Popup } from './entities/popup.entity';
import { PopupDayInfo } from './entities/popup-day-info.entity';
import { PopupReservation } from './entities/popup-reservation.entity';
import { PopupReservationInfo } from './entities/popup-reservation-info.entity';
import { CreatePopupReservationDto } from './dto/create-popup-reservation.dto';

@Injectable()
export class PopupService {
  constructor(
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
      throw new NotFoundException('해당 팝업스토어의 요일별 시간이 존재하지 않습니다.');
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

  async createReservation(userId: number, createPopupReservationDto: CreatePopupReservationDto) {
    const { popupId, date, time, phone, count } = createPopupReservationDto;

    // 1. 예약 슬롯 조회
    let reservation = await this.popupReservationRepository.findOne({
      where: {
        popupId,
        date,
        time,
      },
    });

    // 2. 슬롯이 없으면 생성
    if (!reservation) {
      reservation = await this.popupReservationRepository.save({
        popupId,
        date,
        time,
      });
    }

    // 3. 슬롯이 반드시 존재함 (타입 안정성 확보)
    if (!reservation) {
      throw new Error('예약 슬롯 생성 실패');
    }

    // 4. 예약자 정보 생성
    return await this.popupReservationInfoRepository.save({
      reservationId: reservation.id,
      quantity: count,
      userId,
      reserverPhone: phone,
    });
  }

  update(id: number, updatePopupDto: UpdatePopupDto) {
    return `This action updates a #${id} popup`;
  }

  remove(id: number) {
    return `This action removes a #${id} popup`;
  }
}
