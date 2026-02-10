import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Popup } from 'src/popup/entities/popup.entity';
import { PopupDayInfo } from 'src/popup/entities/popup-day-info.entity';
import { PopupReservation } from 'src/popup/entities/popup-reservation.entity';
import { PopupReservationInfo } from 'src/popup/entities/popup-reservation-info.entity';

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
