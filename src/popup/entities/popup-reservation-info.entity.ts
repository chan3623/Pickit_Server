import { BaseTable } from 'src/common/entities/base-table.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PopupReservation } from './popup-reservation.entity';
import { User } from 'src/user/entities/user.entity';

@Entity('popup_reservation_info')
export class PopupReservationInfo extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'reservationId', type: 'int' })
  reservationId: number;

  @Column({ type: 'int' })
  quantity: number; // 예약 인원 수 (보통 1~n)

  @Column({ name: 'userId', type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 20 })
  reserverPhone: string;

  @ManyToOne(() => PopupReservation, (reserver) => reserver.reservationInfos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reservationId' })
  reservations: PopupReservation;

  @ManyToOne(
    () => User,
    (user) => user.reservationInfos,
    { onDelete: 'RESTRICT' },
  )
  @JoinColumn({ name: 'userId' })
  user: User;
}
