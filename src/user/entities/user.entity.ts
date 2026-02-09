import { BaseTable } from 'src/common/entities/base-table.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PopupReservationInfo } from '../../popup/entities/popup-reservation-info.entity';

export enum Role {
  systemAdmin,
  admin,
  user,
}

@Entity('user')
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.user,
  })
  role: Role;

  @OneToMany(
    () => PopupReservationInfo,
    (reservationInfo) => reservationInfo.user,
  )
  reservationInfos: PopupReservationInfo[];
}
