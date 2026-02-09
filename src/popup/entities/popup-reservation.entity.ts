import { BaseTable } from 'src/common/entities/base-table.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PopupReservationSlot } from './popup-reservation-slot.entity';

@Entity('popup_reservation')
export class PopupReservation extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'slot_id', type: 'int' })
  slotId: number;

  @Column({ type: 'int' })
  quantity: number; // 예약 인원 수 (보통 1~n)

  @Column({ type: 'varchar', length: 50 })
  reserverName: string;

  @Column({ type: 'varchar', length: 20 })
  reserverPhone: string;

  @ManyToOne(() => PopupReservationSlot, (slot) => slot.reservations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'slot_id' })
  slot: PopupReservationSlot;
}
