import { BaseTable } from 'src/common/entities/base-table.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Popup extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  title: string;

  @Column()
  address: string;

  @Column()
  description: string;

  @Column()
  tel: string;

  @Column()
  imageOriginalName: string;

  @Column()
  imagePath: string;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column()
  park: boolean;

  @Column()
  isFree: boolean;

  @ManyToOne(() => User, (user) => user.popups, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}
