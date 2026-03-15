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
import { NotificationService } from '../notifications/notifications.service';
import { User } from '../user/entities/user.entity';
import { CreatePopupReservationDto } from './dto/create-popup-reservation.dto';
import { CreatePopupDto } from './dto/create-popup.dto';
import { ReservationManageQueryDto } from './dto/reservation-manage-query.dto';
import { UpdatePopupCancelDto } from './dto/update-popup-cancel.dto';
import { UpdatePopupStatusDto } from './dto/update-popup-status.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { UpdateUserPopupStatusDto } from './dto/update-user-popup-status.dto';
import { UpdateReservationStatusDto } from './dto/update-user-reservation-status.dto';
import { PopupDayInfo } from './entities/popup-day-info.entity';
import {
  PopupReservationInfo,
  ReservationStatus,
} from './entities/popup-reservation-info.entity';
import { PopupReservation } from './entities/popup-reservation.entity';
import { Popup, PopupStatus } from './entities/popup.entity';
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  async findPopups({
    cursor,
    limit,
    status,
    keyword,
  }: {
    cursor: number | null;
    limit: number;
    status: string;
    keyword: string;
  }) {
    const qb = this.popupRepository
      .createQueryBuilder('popup')
      .orderBy('popup.id', 'DESC')
      .take(limit);

    if (cursor) {
      qb.andWhere('popup.id < :cursor', { cursor });
    }

    if (keyword) {
      qb.andWhere('popup.title LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    if (status && status !== 'ALL') {
      if (status === 'ONGOING') {
        qb.andWhere('popup.startDate <= NOW() AND popup.endDate >= NOW()');
      }

      if (status === 'UPCOMING') {
        qb.andWhere('popup.startDate > NOW()');
      }

      if (status === 'CLOSED') {
        qb.andWhere('popup.endDate < NOW()');
      }
    }

    const popups = await qb.getMany();

    return {
      popups,
      nextCursor: popups.length ? popups[popups.length - 1].id : null,
    };
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

    const reservationIds = userReservationInfos.map(
      (info) => info.reservationId,
    );

    const reservations = await this.popupReservationRepository.find({
      where: { id: In(reservationIds) },
    });

    const popupIds = reservations.map((r) => r.popupId);

    const popups = await this.popupRepository.find({
      where: { id: In(popupIds) },
    });

    const result = userReservationInfos
      .map((info) => {
        const reservation = reservations.find(
          (r) => r.id === info.reservationId,
        );
        if (!reservation) return null;

        const popup = popups.find((p) => p.id === reservation.popupId);
        if (!popup) return null;

        return {
          id: reservation.id,
          popupId: popup.id,
          title: popup.title,
          address: popup.address,
          tel: popup.tel,
          status: info.status,
          imagePath: popup.imagePath,
          reservationDate: reservation.date,
          reservationTime: reservation.time,
          quantity: info.quantity,
          reserverPhone: info.reserverPhone,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (!a || !b) return 0;
        const dateTimeA = new Date(`${a.reservationDate}T${a.reservationTime}`);
        const dateTimeB = new Date(`${b.reservationDate}T${b.reservationTime}`);
        return dateTimeB.getTime() - dateTimeA.getTime(); // 내림차순
      });
    return result;
  }

  async findPopupReservation(popupId: number) {
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

    const dayInfos = await this.popupDayInfoRepository.find({
      where: { popupId },
      order: { dayOfWeek: 'ASC' },
    });

    if (dayInfos.length === 0) {
      throw new NotFoundException(
        '해당 팝업의 요일별 운영 정보가 존재하지 않습니다.',
      );
    }

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

  getServerNowDateAndTime() {
    const newDate = new Date();

    const YEAR = newDate.getFullYear();
    const MONTH = String(newDate.getMonth() + 1).padStart(2, '0');
    const DATE = String(newDate.getDate()).padStart(2, '0');

    const SERVER_DATE = `${YEAR}-${MONTH}-${DATE}`;

    const HOUR = String(newDate.getHours()).padStart(2, '0');
    const MINUTE = String(newDate.getMinutes()).padStart(2, '0');

    const SERVER_TIME = `${HOUR}:${MINUTE}:00`;

    return { SERVER_DATE, SERVER_TIME };
  }

  async findReservationManage(
    userId: number,
    popupId: number,
    query: ReservationManageQueryDto,
  ) {
    const { status, date, email, phone, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const popup = await this.popupRepository.findOne({
      where: { id: popupId, userId },
    });

    if (!popup) {
      throw new BadRequestException('존재하지 않는 팝업스토어입니다.');
    }

    const totalStats = await this.popupReservationInfoRepository
      .createQueryBuilder('pri')
      .innerJoin('pri.reservations', 'pr')
      .select([
        `COUNT(*) FILTER (WHERE pri.status != :cancelPopup) AS "totalReservationCount"`,
        `COUNT(*) FILTER (WHERE pri.status = :reserved) AS "afterReservationCount"`,
        `COUNT(*) FILTER (WHERE pri.status = :noShow) AS "noShowCount"`,
        `COUNT(*) FILTER (WHERE pri.status = :cancelUser) AS "userCancelCount"`,
        `COUNT(*) FILTER (WHERE pri.status = :completed) AS "visitCount"`,
      ])
      .where('pr.popupId = :popupId', { popupId })
      .setParameters({
        cancelPopup: ReservationStatus.CANCELED_BY_POPUP,
        reserved: ReservationStatus.RESERVED,
        noShow: ReservationStatus.NO_SHOW,
        cancelUser: ReservationStatus.CANCELED_BY_USER,
        completed: ReservationStatus.COMPLETED,
      })
      .getRawOne();

    const selectedStats = await this.popupReservationInfoRepository
      .createQueryBuilder('pri')
      .innerJoin('pri.reservations', 'pr')
      .select([
        `COUNT(*) FILTER (WHERE pri.status != :cancelPopup) AS "selectedReservationCount"`,
        `COUNT(*) FILTER (WHERE pri.status = :reserved) AS "selectedAfterReservationCount"`,
        `COUNT(*) FILTER (WHERE pri.status = :noShow) AS "selectedNoShowCount"`,
        `COUNT(*) FILTER (WHERE pri.status = :cancelUser) AS "selectedCancelCount"`,
        `COUNT(*) FILTER (WHERE pri.status = :completed) AS "selectedVisitCount"`,
      ])
      .where('pr.popupId = :popupId', { popupId })
      .andWhere('pr.date = :date', { date })
      .setParameters({
        cancelPopup: ReservationStatus.CANCELED_BY_POPUP,
        reserved: ReservationStatus.RESERVED,
        noShow: ReservationStatus.NO_SHOW,
        cancelUser: ReservationStatus.CANCELED_BY_USER,
        completed: ReservationStatus.COMPLETED,
      })
      .getRawOne();

    /**
     * =========================
     * 1️⃣ 예약 ID 조회 (pagination)
     * =========================
     */
    const idQb = this.popupReservationRepository
      .createQueryBuilder('pr')
      .leftJoin('popup_reservation_info', 'pri', 'pri.reservationId = pr.id')
      .leftJoin('user', 'u', 'u.id = pri.userId')
      .select('DISTINCT pr.id', 'id')
      .where('pr.popupId = :popupId', { popupId })
      .andWhere('pr.date = :date', { date })
      .andWhere('pri.status != :cancelPopup', {
        cancelPopup: ReservationStatus.CANCELED_BY_POPUP,
      });

    if (status) {
      let changeStatus;
      if (status === 'COMPLETED') changeStatus = ReservationStatus.COMPLETED;
      else if (status === 'RESERVED') changeStatus = ReservationStatus.RESERVED;
      else if (status === 'CANCELED_BY_USER')
        changeStatus = ReservationStatus.CANCELED_BY_USER;
      else if (status === 'NO_SHOW') changeStatus = ReservationStatus.NO_SHOW;

      idQb.andWhere('pri.status = :changeStatus', { changeStatus });
    }

    if (email) {
      idQb.andWhere('u.email LIKE :email', {
        email: `%${email}%`,
      });
    }

    if (phone) {
      idQb.andWhere('pri."reserverPhone" LIKE :phone', {
        phone: `%${phone}%`,
      });
    }

    idQb.orderBy('pr.id', 'ASC');

    const reservationIds = await idQb.getRawMany();

    const ids = reservationIds.map((v) => v.id);

    if (ids.length === 0) {
      return {
        totalReservationCount: Number(totalStats.totalReservationCount),
        afterReservationCount: Number(totalStats.afterReservationCount),
        noShowCount: Number(totalStats.noShowCount),
        userCancelCount: Number(totalStats.userCancelCount),
        visitCount: Number(totalStats.visitCount),

        selectedReservationCount: Number(
          selectedStats.selectedReservationCount,
        ),
        selectedAfterReservationCount: Number(
          selectedStats.selectedAfterReservationCount,
        ),
        selectedNoShowCount: Number(selectedStats.selectedNoShowCount),
        selectedCancelCount: Number(selectedStats.selectedCancelCount),
        selectedVisitCount: Number(selectedStats.selectedVisitCount),

        popupReservations: [],
        totalPages: 0,
      };
    }

    /**
     * =========================
     * 2️⃣ 실제 데이터 조회
     * =========================
     */

    const totalCount = await this.popupReservationRepository
      .createQueryBuilder('pr')
      .leftJoin('popup_reservation_info', 'pri', 'pri.reservationId = pr.id')
      .leftJoin('user', 'u', 'u.id = pri.userId')
      .where('pr.id IN (:...ids)', { ids })
      .select('COUNT(pri.id)', 'count')
      .getRawOne();

    const rawQb = this.popupReservationRepository
      .createQueryBuilder('pr')
      .leftJoin('popup_reservation_info', 'pri', 'pri.reservationId = pr.id')
      .leftJoin('user', 'u', 'u.id = pri.userId')
      .select([
        'pr.id AS pr_id',
        "TO_CHAR(pr.date, 'YYYY-MM-DD') AS pr_date",
        "TO_CHAR(pr.time, 'HH24:MI') AS pr_time",

        'pri.id AS pri_id',
        'pri.status AS pri_status',
        'pri.userId AS pri_userId',
        'pri.quantity AS pri_quantity',
        'pri."reserverPhone" AS "pri_reserverPhone"',
        'u.email AS u_email',
      ])
      .where('pr.id IN (:...ids)', { ids });

    if (phone) {
      rawQb.andWhere('pri."reserverPhone" LIKE :phone', {
        phone: `%${phone}%`,
      });
    }

    if (email) {
      rawQb.andWhere('u.email LIKE :email', {
        email: `%${email}%`,
      });
    }

    const rawData = await rawQb
      .orderBy('pr.date', 'ASC')
      .addOrderBy('pr.time', 'ASC')
      .offset(offset)
      .limit(limit)
      .getRawMany();

    /**
     * =========================
     * 3️⃣ 데이터 그룹핑
     * =========================
     */
    const reservationMap = new Map();

    for (const row of rawData) {
      if (!reservationMap.has(row.pr_id)) {
        reservationMap.set(row.pr_id, {
          id: row.pr_id,
          date: row.pr_date,
          time: row.pr_time,
          reservationInfos: [],
        });
      }

      if (row.pri_id) {
        reservationMap.get(row.pr_id).reservationInfos.push({
          id: row.pri_id,
          status: row.pri_status,
          userId: row.pri_userId,
          quantity: row.pri_quantity,
          reserverPhone: row.pri_reserverPhone,
          userEmail: row.u_email,
        });
      }
    }

    const totalPages = Math.ceil(totalCount.count / limit);

    return {
      totalReservationCount: Number(totalStats.totalReservationCount),
      afterReservationCount: Number(totalStats.afterReservationCount),
      noShowCount: Number(totalStats.noShowCount),
      userCancelCount: Number(totalStats.userCancelCount),
      visitCount: Number(totalStats.visitCount),

      selectedReservationCount: Number(selectedStats.selectedReservationCount),
      selectedAfterReservationCount: Number(
        selectedStats.selectedAfterReservationCount,
      ),
      selectedNoShowCount: Number(selectedStats.selectedNoShowCount),
      selectedCancelCount: Number(selectedStats.selectedCancelCount),
      selectedVisitCount: Number(selectedStats.selectedVisitCount),

      popupReservations: Array.from(reservationMap.values()),
      totalPages,
    };
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
        const popup = await manager.findOne(Popup, {
          select: { title: true, userId: true },
          where: { id: popupId },
        });

        if (!popup) {
          throw new BadRequestException('존재하지 않는 팝업 ID입니다.');
        }

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

        this.notificationService.createAndSend(
          popup.userId,
          `${popup.title}(${date} ${time}) 예약 진행었습니다.`,
          ReservationStatus.RESERVED,
        );

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

  async updateReservationStatus(
    updateReservationStatusDto: UpdateReservationStatusDto,
  ) {
    const { id, status } = updateReservationStatusDto;

    let updateStatus;
    if (status === 'COMPLETED') {
      updateStatus = ReservationStatus.COMPLETED;
    } else if (status === 'NO_SHOW') {
      updateStatus = ReservationStatus.NO_SHOW;
    } else {
      throw new BadRequestException('잘못된 상태값입니다.');
    }

    const userReservation = await this.popupReservationInfoRepository.findOne({
      where: { id },
    });

    if (!userReservation) {
      throw new BadRequestException('존재하지 않는 유저 예약 정보입니다.');
    }

    return await this.popupReservationInfoRepository.update(
      { id },
      { status: updateStatus },
    );
  }

  async cancelUserReservation(
    userId: number,
    updateUserPopupStatusDto: UpdateUserPopupStatusDto,
  ) {
    const { id, status, popupId } = updateUserPopupStatusDto;

    if (status !== ReservationStatus.CANCELED_BY_USER) {
      throw new BadRequestException('상태 값이 잘못되었습니다.');
    }

    const popup = await this.popupRepository.findOne({
      where: { id: popupId },
    });

    if (!popup) {
      throw new BadRequestException('존재하지 않는 팝업의 ID입니다.');
    }

    const findUserReservation =
      await this.popupReservationInfoRepository.findOne({
        where: { id, userId, status: ReservationStatus.RESERVED },
      });

    if (!findUserReservation) {
      throw new BadRequestException('존재하지 않는 예약내역입니다.');
    }

    await this.popupReservationInfoRepository.update(
      { id, userId },
      { status },
    );

    const findReservation = await this.popupReservationRepository.findOne({
      where: { id: findUserReservation.reservationId },
    });

    if (!findReservation) {
      throw new BadRequestException('존재하지 않는 예약내역입니다.');
    }

    const newCurrentCount =
      Number(findReservation.currentCount) -
      Number(findUserReservation.quantity);

    await this.popupReservationRepository.update(
      { id: findUserReservation.reservationId },
      { currentCount: newCurrentCount },
    );

    const newUserReservation =
      await this.popupReservationInfoRepository.findOne({
        where: { id, userId },
      });

    this.notificationService.createAndSend(
      popup.userId,
      `${popup.title}(${findReservation.date} ${findReservation.time}) 예약이 취소되었습니다.`,
      ReservationStatus.RESERVED,
    );

    return newUserReservation;
  }

  async popupEarlyClosed(
    userId: number,
    updatePopupStatusDto: UpdatePopupStatusDto,
  ) {
    const { id, status } = updatePopupStatusDto;

    if (status !== PopupStatus.EARLY_CLOSED) {
      throw new BadRequestException('상태 값이 잘못되었습니다.');
    }

    const findPopup = await this.popupRepository.findOne({
      where: { id, userId },
    });

    if (!findPopup) {
      throw new BadRequestException('존재하지 않는 팝업스토어입니다.');
    }

    await this.popupRepository.update({ id }, { status });

    const updatePopup = await this.popupRepository.findOne({ where: { id } });

    return updatePopup;
  }

  async popupCancel(
    userId: number,
    updatePopupCancelDto: UpdatePopupCancelDto,
  ) {
    const { id, status, date, time } = updatePopupCancelDto;

    if (status !== PopupStatus.CANCELED) {
      throw new BadRequestException('status 값이 잘못되었습니다.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const popup = await queryRunner.manager.findOne(Popup, {
        where: { id, userId },
      });

      if (!popup) {
        throw new BadRequestException('존재하지 않는 팝업스토어입니다.');
      }

      if (popup.status !== PopupStatus.ACTIVE) {
        throw new BadRequestException('이미 취소되었거나 운영 중이 아닙니다.');
      }

      // 1️⃣ 팝업 상태 변경
      await queryRunner.manager.update(
        Popup,
        { id, userId, status: PopupStatus.ACTIVE },
        { status: PopupStatus.CANCELED },
      );

      // 2️⃣ 취소 시점 이후 예약 정보 조회
      const reservations = await queryRunner.manager
        .createQueryBuilder(PopupReservationInfo, 'pri')
        .innerJoinAndSelect('pri.reservations', 'r')
        .where(
          `r.popupId = :id AND (r.date + r.time) >= (CAST(:date AS date) + CAST(:time AS time))`,
          { id, date, time },
        )
        .andWhere('pri.status = :reservedStatus', {
          reservedStatus: ReservationStatus.RESERVED,
        })
        .getMany();

      // 2️⃣ 취소 시점 이후 예약 상태 변경
      await queryRunner.manager
        .createQueryBuilder()
        .update(PopupReservationInfo)
        .set({ status: ReservationStatus.CANCELED_BY_POPUP })
        .where(
          `"reservationId" IN (
          SELECT r."id"
          FROM "popup_reservation" r
          WHERE r."popupId" = :id
          AND (r."date" + r."time") >= (CAST(:date AS date) + CAST(:time AS time))
        )`,
        )
        .andWhere('"status" = :reservedStatus')
        .setParameters({
          id,
          date,
          time,
          reservedStatus: ReservationStatus.RESERVED,
        })
        .execute();

      // 3️⃣ 해당 reservation들의 currentCount = 0 처리
      await queryRunner.manager
        .createQueryBuilder()
        .update(PopupReservation)
        .set({ currentCount: 0 })
        .where(
          `"popupId" = :id
         AND ("date" + "time") >= (CAST(:date AS date) + CAST(:time AS time))`,
        )
        .setParameters({
          id,
          date,
          time,
        })
        .execute();

      for (const r of reservations) {
        this.notificationService.createAndSend(
          r.userId,
          `${popup.title} 팝업이 운영 취소되어 예약이 취소되었습니다.`,
          ReservationStatus.CANCELED_BY_POPUP,
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return await this.popupRepository.findOne({ where: { id } });
  }
}
