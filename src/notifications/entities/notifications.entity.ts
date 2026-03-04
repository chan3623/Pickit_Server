import { BaseTable } from 'src/common/entities/base-table.entity';
import { ReservationStatus } from 'src/popup/entities/popup-reservation-info.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
