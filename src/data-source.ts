import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Notifications } from './notifications/entities/notifications.entity';
import { PopupDayInfo } from './popup/entities/popup-day-info.entity';
import { PopupReservationInfo } from './popup/entities/popup-reservation-info.entity';
import { PopupReservation } from './popup/entities/popup-reservation.entity';
import { Popup } from './popup/entities/popup.entity';
import { User } from './user/entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    Popup,
    PopupDayInfo,
    PopupReservation,
    PopupReservationInfo,
    User,
    Notifications,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
