import { BaseTable } from 'src/common/entities/base-table.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Popup } from './popup.entity';

@Entity('popup_day_info')
export class PopupDayInfo extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Popup, (popup) => popup.dayInfos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'popupId' })
  popup: Popup;

  @Column({ name: 'popupId', type: 'int' })
  popupId: number;

  @Column({ type: 'smallint' })
  dayOfWeek: number; // 1~7 (월~일)

  @Column({ type: 'time' })
  openTime: string; // '10:00'

  @Column({ type: 'time' })
  closeTime: string; // '19:00'

  @Column({ type: 'int' })
  slotMinute: number; // '30, 60, 90'

  @Column({ type: 'int', name: 'capacityPerSlot', default: 0 })
  capacityPerSlot: number; // 한 타임별 수용 인원 수
}
