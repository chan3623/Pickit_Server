import { BaseTable } from 'src/common/entities/base-table.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PopupReservation } from './popup-reservation.entity';

export enum ReservationStatus {
  RESERVED = 'RESERVED',
  COMPLETED = 'COMPLETED',
  CANCELED_BY_USER = 'CANCELED_BY_USER',
  CANCELED_BY_POPUP = 'CANCELED_BY_POPUP',
}

@Entity('popup_reservation_info')
@Index('idx_pri_status', ['status'])
export class PopupReservationInfo extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'reservationId', type: 'int' })
  reservationId: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'userId', type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 20 })
  reserverPhone: string;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.RESERVED,
  })
  status: ReservationStatus;

  @ManyToOne(
    () => PopupReservation,
    (reservation) => reservation.reservationInfos,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'reservationId' })
  reservations: PopupReservation;

  @ManyToOne(() => User, (user) => user.reservationInfos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
