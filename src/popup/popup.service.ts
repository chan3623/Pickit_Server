import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import fs from 'fs';
import path from 'path';
import { NotificationService } from 'src/notifications/notifications.service';
import { User } from 'src/user/entities/user.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CreatePopupReservationDto } from './dto/create-popup-reservation.dto';
import { CreatePopupDto } from './dto/create-popup.dto';
import { ReservationManageQueryDto } from './dto/reservation-manage-query.dto';
import { UpdatePopupCancelDto } from './dto/update-popup-cancel.dto';
import { UpdatePopupStatusDto } from './dto/update-popup-status.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { UpdateUserPopupStatusDto } from './dto/update-user-popup-status.dto';
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
    const { status, date, email, phone } = query;

    const popup = await this.popupRepository.findOne({
      where: { id: popupId, userId },
    });

    if (!popup) {
      throw new BadRequestException('존재하지 않는 팝업스토어입니다.');
    }

    /**
     * =========================
     * 1️⃣ 전체 통계 집계
     * =========================
     */
    const totalStats = await this.popupReservationInfoRepository
      .createQueryBuilder('pri')
      .innerJoin('pri.reservations', 'pr')
      .select([
        `COUNT(*) FILTER (WHERE pri.status != :cancelPopup) AS "totalReservationCount"`,
        `COUNT(*) FILTER (WHERE pri.status = :reserved) AS "afterReservationCount"`,
        `COUNT(*) FILTER (WHERE pri.status = :cancelUser) AS "userCancelCount"`,
        `COUNT(*) FILTER (WHERE pri.status = :completed) AS "visitCount"`,
      ])
      .where('pr.popupId = :popupId', { popupId })
      .setParameters({
        cancelPopup: ReservationStatus.CANCELED_BY_POPUP,
        reserved: ReservationStatus.RESERVED,
        cancelUser: ReservationStatus.CANCELED_BY_USER,
        completed: ReservationStatus.COMPLETED,
      })
      .getRawOne();

    /**
     * =========================
     * 2️⃣ 선택 날짜 통계 집계
     * =========================
     */
    const selectedStats = await this.popupReservationInfoRepository
      .createQueryBuilder('pri')
      .innerJoin('pri.reservations', 'pr')
      .select([
        `COUNT(*) FILTER (WHERE pri.status != :cancelPopup) AS "selectedReservationCount"`,
        `COUNT(*) FILTER (WHERE pri.status = :reserved) AS "selectedAfterReservationCount"`,
        `COUNT(*) FILTER (WHERE pri.status = :cancelUser) AS "selectedCancelCount"`,
        `COUNT(*) FILTER (WHERE pri.status = :completed) AS "selectedVisitCount"`,
      ])
      .where('pr.popupId = :popupId', { popupId })
      .andWhere('pr.date = :date', { date })
      .setParameters({
        cancelPopup: ReservationStatus.CANCELED_BY_POPUP,
        reserved: ReservationStatus.RESERVED,
        cancelUser: ReservationStatus.CANCELED_BY_USER,
        completed: ReservationStatus.COMPLETED,
      })
      .getRawOne();

    /**
     * =========================
     * 3️⃣ 선택 날짜 예약 목록 조회 (필터 적용)
     * =========================
     */
    const qb = this.popupReservationRepository
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
      .where('pr.popupId = :popupId', { popupId })
      .andWhere('pr.date = :date', { date })
      .andWhere('pri.status != :cancelPopup', {
        cancelPopup: ReservationStatus.CANCELED_BY_POPUP,
      });

    /**
     * 🔎 선택 필터 동적 적용
     */
    if (status) {
      let changeStatus;
      if (status === 'COMPLETED') {
        changeStatus = ReservationStatus.COMPLETED;
      } else if (status === 'RESERVED') {
        changeStatus = ReservationStatus.RESERVED;
      } else if (status === 'CANCELED_BY_USER') {
        changeStatus = ReservationStatus.CANCELED_BY_USER;
      }
      qb.andWhere('pri.status = :changeStatus', { changeStatus });
    }

    if (email) {
      qb.andWhere('u.email LIKE :email', {
        email: `%${email}%`,
      });
    }

    if (phone) {
      qb.andWhere('pri."reserverPhone" LIKE :phone', {
        phone: `%${phone}%`,
      });
    }

    qb.orderBy('pr.date', 'ASC').addOrderBy('pr.time', 'ASC');

    const rawData = await qb.getRawMany();

    /**
     * =========================
     * 4️⃣ 데이터 그룹핑
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

    return {
      totalReservationCount: Number(totalStats.totalReservationCount),
      afterReservationCount: Number(totalStats.afterReservationCount),
      userCancelCount: Number(totalStats.userCancelCount),
      visitCount: Number(totalStats.visitCount),

      selectedReservationCount: Number(selectedStats.selectedReservationCount),
      selectedAfterReservationCount: Number(
        selectedStats.selectedAfterReservationCount,
      ),
      selectedCancelCount: Number(selectedStats.selectedCancelCount),
      selectedVisitCount: Number(selectedStats.selectedVisitCount),

      popupReservations: Array.from(reservationMap.values()),
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

  async cancelUserReservation(
    userId: number,
    updateUserPopupStatusDto: UpdateUserPopupStatusDto,
  ) {
    const { id, status } = updateUserPopupStatusDto;

    if (status !== ReservationStatus.CANCELED_BY_USER) {
      throw new BadRequestException('상태 값이 잘못되었습니다.');
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
        console.log('Sending notification to user', r.userId);
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

  @Cron('*/5 * * * *')
  async autoCompleteReservations() {
    await this.dataSource.query(`
    UPDATE popup_reservation_info pri
    SET status = 'COMPLETED'
    FROM popup_reservation pr
    WHERE pri."reservationId" = pr.id
      AND pri.status = 'RESERVED'
      AND (pr.date::timestamp + pr.time) <= NOW()
  `);
  }
}
