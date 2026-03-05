import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { PopupDayInfo } from '../popup/entities/popup-day-info.entity';
import { PopupReservationInfo } from '../popup/entities/popup-reservation-info.entity';
import { PopupReservation } from '../popup/entities/popup-reservation.entity';
import { Popup } from '../popup/entities/popup.entity';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Popup,
      PopupDayInfo,
      PopupReservation,
      PopupReservationInfo,
    ]),
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService, AuthService],
})
export class UserModule {}
