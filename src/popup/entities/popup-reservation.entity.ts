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
import { PopupReservationInfo } from './popup-reservation-info.entity';
import { Popup } from './popup.entity';

@Entity('popup_reservation')
@Unique(['popupId', 'date', 'time'])
export class PopupReservation extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'popupId', type: 'int' })
  popupId: number;

  @Column({ type: 'date' })
  date: string; // 2026-02-05

  @Column({ type: 'time' })
  time: string; // 10:00:00

  @Column({ type: 'int', default: 0 })
  currentCount: number;

  @ManyToOne(() => Popup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'popupId' })
  popup: Popup;

  @OneToMany(() => PopupReservationInfo, (info) => info.reservations)
  reservationInfos: PopupReservationInfo[];
}
