import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { PopupOperationPolicyDay } from './entities/popup-operation-policy-day.entity';
import { PopupOperationPolicy } from './entities/popup-operation-policy.entity';
import { PopupReservationSlot } from './entities/popup-reservation-slot.entity';
import { PopupReservation } from './entities/popup-reservation.entity';
import { Popup } from './entities/popup.entity';

@Injectable()
export class PopupService {
  constructor(
    @InjectRepository(Popup)
    private readonly popupRepository: Repository<Popup>,
    @InjectRepository(PopupOperationPolicy)
    private readonly popupOperationPolicyRepository: Repository<PopupOperationPolicy>,
    @InjectRepository(PopupOperationPolicyDay)
    private readonly popupOperationPolicyDayRepository: Repository<PopupOperationPolicyDay>,
    @InjectRepository(PopupReservationSlot)
    private readonly popupReservationSlotRepository: Repository<PopupReservationSlot>,
    @InjectRepository(PopupReservation)
    private readonly popupReservationRepository: Repository<PopupReservation>,
  ) {}

  create(createPopupDto: CreatePopupDto) {
    return 'This action adds a new popup';
  }

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

  async findPopupOperation(id: number) {
    const popup = await this.popupRepository.findOne({
      where: { id },
    });

    if (!popup) {
      throw new NotFoundException('존재하지 않는 ID입니다.');
    }

    const policy = await this.popupOperationPolicyRepository.find({
      where: { popupId: popup.id },
    });

    if (policy.length === 0) {
      throw new NotFoundException(
        '해당 팝업스토어의 운영시간이 존재하지 않습니다.',
      );
    }

    const policyIds = policy.map((p) => p.id);

    const policyDay = await this.popupOperationPolicyDayRepository.find({
      where: { policyId: In(policyIds) },
    });

    if (policyDay.length === 0) {
      throw new NotFoundException(
        '해당 팝업스토어의 요일별 정보가 존재하지 않습니다.',
      );
    }

    /**
     * 🔥 slot + 예약 인원 집계
     */
    const slots = await this.popupReservationSlotRepository
      .createQueryBuilder('slot')
      .leftJoin('slot.reservations', 'reservation')
      .select([
        'slot.id AS id',
        'slot.policy_id AS "policyId"',
        'slot.date AS date',
        'slot.time AS time',
        'COALESCE(SUM(reservation.quantity), 0) AS reserved',
      ])
      .where('slot.policy_id IN (:...policyIds)', { policyIds })
      .groupBy('slot.id')
      .orderBy('slot.date', 'ASC')
      .addOrderBy('slot.time', 'ASC')
      .getRawMany();

    return {
      popup,
      policy,
      policyDay,
      slots,
    };
  }

  async findPopupDetail(id: number) {
    const detail = await this.popupRepository.findOne({
      select: {
        description: true,
        tel: true,
      },
      where: {
        id,
      },
    });

    if (!detail) {
      throw new NotFoundException('존재하지 않는 ID의 팝업스토어입니다.');
    }

    return detail;
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

  update(id: number, updatePopupDto: UpdatePopupDto) {
    return `This action updates a #${id} popup`;
  }

  remove(id: number) {
    return `This action removes a #${id} popup`;
  }
}
