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
  startDate: Date;

  @Column()
  endDate: Date;
}
