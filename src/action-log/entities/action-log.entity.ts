import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTable } from '../../common/entities/base-table.entity';

export enum ActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CANCEL = 'CANCEL',
}

export enum TargetEntity {
  POPUP = 'POPUP',
  RESERVATION = 'RESERVATION',
}

@Entity()
export class ActionLog extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number;

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  action: ActionType;

  @Column({
    type: 'enum',
    enum: TargetEntity,
  })
  targetEntity: TargetEntity;

  @Column({ nullable: true })
  targetId: number;

  @Column({ type: 'text', nullable: true })
  details: string;
}
