import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTable } from '../../common/entities/base-table.entity';
import { ReservationStatus } from '../../popup/entities/popup-reservation-info.entity';

@Entity()
export class Notifications extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  type: ReservationStatus;

  @Column()
  message: string;

  @Column({ default: false })
  isRead: boolean;
}
