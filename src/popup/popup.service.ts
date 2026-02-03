import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { Popup } from './entities/popup.entity';
import { PopupOperationPolicy } from './entities/popup-operation-policy.entity';
import { PopupOperationPolicyDay } from './entities/popup-operation-policy-day.entity';

@Injectable()
export class PopupService {
  constructor(
    @InjectRepository(Popup)
    private readonly popupRepository: Repository<Popup>,
    @InjectRepository(PopupOperationPolicy)
    private readonly popupOperationPolicyRepository: Repository<PopupOperationPolicy>,
    @InjectRepository(PopupOperationPolicyDay)
    private readonly popupOperationPolicyDayRepository: Repository<PopupOperationPolicyDay>,
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

    if(!popup){
      throw new NotFoundException('존재하지 않는 ID입니다.');
    }

    const policy = await this.popupOperationPolicyRepository.find({
      where: {
        popupId: popup.id,
      },
    });

    if(!policy){
      throw new NotFoundException('존재하지 않는 ID입니다.');
    }

    const policyIds = policy.map((item) => item.id);

    const policyDay = await this.popupOperationPolicyDayRepository.find({
      where: {
        policyId: In(policyIds),
      },
    });

    return {
      popup,
      policy,
      policyDay,
    };
  }

  async findOne(id: number) {
    const popup = await this.popupRepository.findOne({
      where: { id },
    });

    if(!popup){
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
