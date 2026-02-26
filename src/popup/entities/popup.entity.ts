import { BaseTable } from 'src/common/entities/base-table.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PopupDayInfo } from './popup-day-info.entity';

export enum PopupStatus {
  ACTIVE = 'ACTIVE',
  EARLY_CLOSED = 'EARLY_CLOSED',
  CANCELED = 'CANCELED',
  CLOSED = 'CLOSED',
}

@Entity()
export class Popup extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  title: string;

  @Column()
  address: string;

  @Column()
  detailAddress: string;

  @Column()
  description: string;

  @Column()
  tel: string;

  @Column()
  imageOriginalName: string;

  @Column()
  imagePath: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column()
  park: boolean;

  @Column()
  isFree: boolean;

  @Column({
    type: 'enum',
    enum: PopupStatus,
    default: PopupStatus.ACTIVE,
  })
  status: PopupStatus;

  @OneToMany(() => PopupDayInfo, (dayInfo) => dayInfo.popup, {
    cascade: true,
  })
  dayInfos: PopupDayInfo[];

  @ManyToOne(() => User, (user) => user.popups, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}
