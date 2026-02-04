import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PopupOperationPolicyDay } from './entities/popup-operation-policy-day.entity';
import { PopupOperationPolicy } from './entities/popup-operation-policy.entity';
import { Popup } from './entities/popup.entity';
import { PopupController } from './popup.controller';
import { PopupService } from './popup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Popup,
      PopupOperationPolicy,
      PopupOperationPolicyDay,
    ]),
  ],
  controllers: [PopupController],
  providers: [PopupService],
})
export class PopupModule {}
