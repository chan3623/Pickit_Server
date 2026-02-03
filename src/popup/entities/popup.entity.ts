import { BaseTable } from 'src/common/entities/base-table.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Popup extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  //   @Column()
  //   creator: string;

  @Column({ unique: true })
  title: string;

  @Column()
  address: string;

  @Column()
  description: string;

  @Column()
  imagePath: string;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column()
  park: boolean;

  @Column()
  is_free: boolean;
}
