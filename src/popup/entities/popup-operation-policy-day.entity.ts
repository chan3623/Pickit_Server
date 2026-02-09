import { BaseTable } from 'src/common/entities/base-table.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PopupOperationPolicy } from './popup-operation-policy.entity';

@Entity('popup_operation_policy_day')
export class PopupOperationPolicyDay extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'policy_id', type: 'int' })
  policyId: number;

  @Column({ type: 'smallint' })
  dayOfWeek: number; // 1~7 (월~일)

  @ManyToOne(() => PopupOperationPolicy, (policy) => policy.days, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'policy_id' })
  policy: PopupOperationPolicy;
}
