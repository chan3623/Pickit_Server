import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Popup } from './entities/popup.entity';
import { PopupController } from './popup.controller';
import { PopupService } from './popup.service';
import { PopupDayInfo } from './entities/popup-day-info.entity';
import { PopupReservation } from './entities/popup-reservation.entity';
import { PopupReservationInfo } from './entities/popup-reservation-info.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Popup,
      PopupDayInfo,
      PopupReservation,
      PopupReservationInfo,
    ]),
  ],
  controllers: [PopupController],
  providers: [PopupService],
})
export class PopupModule {}
