import { BaseTable } from 'src/common/entities/base-table.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum Role {
  systemAdmin,
  admin,
  user,
}

@Entity()
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({
    enum: Role,
    default: Role.user,
  })
  role: Role;
}
