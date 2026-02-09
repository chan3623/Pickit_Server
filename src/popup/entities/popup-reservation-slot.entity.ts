import { BaseTable } from 'src/common/entities/base-table.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PopupOperationPolicy } from './popup-operation-policy.entity';
import { PopupReservation } from './popup-reservation.entity';

@Entity('popup_reservation_slot')
@Unique(['policyId', 'date', 'time'])
export class PopupReservationSlot extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'policy_id', type: 'int' })
  policyId: number;

  @Column({ type: 'date' })
  date: string; // 2026-02-05

  @Column({ type: 'time' })
  time: string; // 10:00:00

  @ManyToOne(() => PopupOperationPolicy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policy_id' })
  policy: PopupOperationPolicy;

  @OneToMany(() => PopupReservation, (r) => r.slot)
  reservations: PopupReservation[];
}
