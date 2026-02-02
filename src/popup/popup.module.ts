import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Popup } from './entities/popup.entity';
import { PopupController } from './popup.controller';
import { PopupService } from './popup.service';
import { PopupOperationPolicy } from './entities/popup-operation-policy.entity';
import { PopupOperationPolicyDay } from './entities/popup-operation-policy-day.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Popup, PopupOperationPolicy, PopupOperationPolicyDay])],
  controllers: [PopupController],
  providers: [PopupService],
})
export class PopupModule {}
