import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import fs from 'fs';
import path from 'path';
import { DataSource, In, Repository } from 'typeorm';
import { CreatePopupReservationDto } from './dto/create-popup-reservation.dto';
import { CreatePopupDto } from './dto/create-popup.dto';
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

  async findPopups() {
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

  async findUserReservations(userId: number) {
    const userReservationInfos = await this.popupReservationInfoRepository.find(
      {
        where: { userId },
      },
    );

    if (!userReservationInfos.length) return [];

    // 2. 예약 ID 배열 추출
    const reservationIds = userReservationInfos.map(
      (info) => info.reservationId,
    );

    // 3. 예약 정보 조회 (PopupReservation)
    const reservations = await this.popupReservationRepository.find({
      where: { id: In(reservationIds) },
    });

    // 4. 팝업 ID 배열 추출
    const popupIds = reservations.map((r) => r.popupId);

    // 5. 팝업 정보 조회
    const popups = await this.popupRepository.find({
      where: { id: In(popupIds) },
    });

    // 6. 데이터를 하나로 묶기
    const result = userReservationInfos
      .map((info) => {
        const reservation = reservations.find(
          (r) => r.id === info.reservationId,
        );
        if (!reservation) return null;

        const popup = popups.find((p) => p.id === reservation.popupId);
        if (!popup) return null;

        return {
          popupId: popup.id,
          title: popup.title,
          address: popup.address,
          tel: popup.tel,
          imagePath: popup.imagePath,
          reservationDate: reservation.date,
          reservationTime: reservation.time,
          quantity: info.quantity,
          reserverPhone: info.reserverPhone,
        };
      })
      .filter(Boolean)
      // 7. 최근 예약순 정렬
      .sort((a, b) => {
        if (!a || !b) return 0;
        const dateTimeA = new Date(`${a.reservationDate}T${a.reservationTime}`);
        const dateTimeB = new Date(`${b.reservationDate}T${b.reservationTime}`);
        return dateTimeB.getTime() - dateTimeA.getTime(); // 내림차순
      });
    return result;
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

  async findManagerPopups(userId: number) {
    const popups = await this.popupRepository.find({
      where: { userId },
      order: {
        endDate: 'DESC',
        startDate: 'DESC',
        title: 'ASC',
      },
    });

    if (!popups) {
      return [];
    }

    const popupIds = popups.map((popup) => popup.id);

    const popupDayInfo = await this.popupDayInfoRepository.find({
      where: { popupId: In(popupIds) },
    });

    const result = popups.map((popup) => {
      const findPopupDayInfos = popupDayInfo.filter(
        (d) => d.popupId === popup.id,
      );

      if (findPopupDayInfos) {
        return {
          ...popup,
          dayInfo: findPopupDayInfos,
        };
      } else {
        return popup;
      }
    });

    return result;
  }

  makeImageInfo(filename: string, originalname: string) {
    const tempFilePath = path.join(process.cwd(), 'uploads', 'temp', filename);
    const popupDir = path.join(process.cwd(), 'uploads', 'popup');
    const popupFilePath = path.join(popupDir, filename);
    const imagePath = `/uploads/popup/${filename}`;
    const imageOriginalName = originalname;

    return {
      tempFilePath,
      popupDir,
      popupFilePath,
      imagePath,
      imageOriginalName,
    };
  }

  async createPopup(
    userId: number,
    createPopupDto: CreatePopupDto,
    image: Express.Multer.File,
  ) {
    const {
      title,
      startDate,
      endDate,
      address,
      detailAddress,
      description,
      tel,
      park,
      isFree,
      dayInfos,
    } = createPopupDto;

    if (!image || !image.filename || !image.originalname) {
      throw new BadRequestException('이미지 정보가 잘못되었습니다.');
    }

    const {
      tempFilePath,
      popupDir,
      popupFilePath,
      imagePath,
      imageOriginalName,
    } = this.makeImageInfo(image.filename, image.originalname);

    if (!fs.existsSync(popupDir)) {
      fs.mkdirSync(popupDir, { recursive: true });
    }

    try {
      fs.renameSync(tempFilePath, popupFilePath);
    } catch {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw new BadRequestException('이미지 이동에 실패했습니다');
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    let popup;
    let popupDayInfos;
    try {
      popup = qr.manager.create(Popup, {
        title,
        startDate,
        endDate,
        address,
        detailAddress,
        description,
        tel,
        park,
        isFree,
        userId,
        imagePath,
        imageOriginalName,
      });

      const newPopup = await qr.manager.save(popup);

      popupDayInfos = dayInfos.map((info) =>
        qr.manager.create(PopupDayInfo, {
          popupId: newPopup.id,
          dayOfWeek: info.dayOfWeek,
          openTime: info.openTime,
          closeTime: info.closeTime,
          slotMinute: info.slotMinute,
          capacityPerSlot: info.capacityPerSlot,
        }),
      );

      await qr.manager.save(PopupDayInfo, popupDayInfos);

      await qr.commitTransaction();
    } catch (e) {
      await qr.rollbackTransaction();

      if (fs.existsSync(popupFilePath)) {
        fs.unlinkSync(popupFilePath);
      }
      console.log(e);
      throw new InternalServerErrorException('팝업스토어 등록에 실패했습니다.');
    } finally {
      await qr.release();
    }
    return { popup, popupDayInfos };
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

  async updatePopup(
    userId: number,
    updatePopupDto: UpdatePopupDto,
    image?: Express.Multer.File,
  ) {
    const {
      id,
      title,
      startDate,
      endDate,
      address,
      detailAddress,
      description,
      tel,
      park,
      isFree,
      dayInfos,
    } = updatePopupDto;

    let imageInfo;
    let oldImagePath;

    if (image && image.filename && image.originalname) {
      imageInfo = this.makeImageInfo(image.filename, image.originalname);

      if (!fs.existsSync(imageInfo.popupDir)) {
        fs.mkdirSync(imageInfo.popupDir, { recursive: true });
      }

      try {
        fs.renameSync(imageInfo.tempFilePath, imageInfo.popupFilePath);
      } catch {
        if (fs.existsSync(imageInfo.tempFilePath)) {
          fs.unlinkSync(imageInfo.tempFilePath);
        }
        throw new BadRequestException('이미지 이동에 실패했습니다');
      }
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const findPopup = await qr.manager.findOne(Popup, { where: { id } });

      if (!findPopup) {
        throw new BadRequestException('존재하지 않는 팝업입니다.');
      }

      oldImagePath = path.join(process.cwd(), findPopup.imagePath);

      await qr.manager.update(
        Popup,
        { id },
        {
          title,
          startDate,
          endDate,
          address,
          detailAddress,
          description,
          tel,
          park,
          isFree,
          userId,
          imagePath: image ? imageInfo.imagePath : findPopup.imagePath,
          imageOriginalName: image
            ? imageInfo.imageOriginalName
            : findPopup.imageOriginalName,
        },
      );

      const findDayInfo = await qr.manager.find(PopupDayInfo, {
        where: { popupId: id },
      });

      if (findDayInfo) {
        await qr.manager.delete(PopupDayInfo, { popupId: id });
      }

      const popupDayInfos = dayInfos.map((info) =>
        qr.manager.create(PopupDayInfo, {
          popupId: id,
          dayOfWeek: info.dayOfWeek,
          openTime: info.openTime,
          closeTime: info.closeTime,
          slotMinute: info.slotMinute,
          capacityPerSlot: info.capacityPerSlot,
        }),
      );

      await qr.manager.save(PopupDayInfo, popupDayInfos);

      await qr.commitTransaction();
    } catch (e) {
      await qr.rollbackTransaction();

      if (image && fs.existsSync(imageInfo.popupFilePath)) {
        fs.unlinkSync(imageInfo.popupFilePath);
      }
      console.log('e : ', e);
    } finally {
      await qr.release();
    }

    if (image && fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }

    const result = await this.popupRepository.findOne({
      where: { id },
      relations: ['dayInfos'],
    });

    return result;
  }
}
