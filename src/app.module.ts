import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import Joi from 'joi';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guard/jwt-auth-guard';
import { PopupDayInfo } from './popup/entities/popup-day-info.entity';
import { PopupReservationInfo } from './popup/entities/popup-reservation-info.entity';
import { PopupReservation } from './popup/entities/popup-reservation.entity';
import { Popup } from './popup/entities/popup.entity';
import { PopupModule } from './popup/popup.module';
import { User } from './user/entities/user.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HASH_ROUNDS: Joi.number().required(),
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'parkchanryong',
      password: 'chn80114841',
      database: 'PICKIT',
      synchronize: true,
      entities: [
        Popup,
        PopupDayInfo,
        PopupReservation,
        PopupReservationInfo,
        User,
      ],
    }),
    ScheduleModule.forRoot(),
    PopupModule,
    UserModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
