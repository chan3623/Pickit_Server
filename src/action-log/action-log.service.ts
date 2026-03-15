import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionLog, ActionType, TargetEntity } from './entities/action-log.entity';

@Injectable()
export class ActionLogService {
  constructor(
    @InjectRepository(ActionLog)
    private readonly actionLogRepository: Repository<ActionLog>,
  ) {}

  async logAction(
    userId: number,
    action: ActionType,
    targetEntity: TargetEntity,
    targetId?: number,
    details?: string,
  ) {
    const log = this.actionLogRepository.create({
      userId,
      action,
      targetEntity,
      targetId,
      details,
    });
    return await this.actionLogRepository.save(log);
  }
}
