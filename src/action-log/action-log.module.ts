import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionLog } from './entities/action-log.entity';
import { ActionLogService } from './action-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([ActionLog])],
  providers: [ActionLogService],
  exports: [ActionLogService], // 다른 모듈에서 사용하기 위해 exports 추가
})
export class ActionLogModule {}
