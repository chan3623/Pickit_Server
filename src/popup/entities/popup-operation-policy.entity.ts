import { BaseTable } from "src/common/entities/base-table.entity";
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PopupOperationPolicyDay } from "./popup-operation-policy-day.entity";

@Entity("popup_operation_policy")
export class PopupOperationPolicy extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "popup_id", type: "int" })
  popupId: number;

  @Column({ type: "time" })
  openTime: string; // '10:00'

  @Column({ type: "time" })
  closeTime: string; // '19:00'

  @Column({ type: "int" })
  slotMinute: number; // '30, 60, 90'

  @Column({ type: "int", name: "capacity_per_slot", default: 0 })
  capacityPerSlot: number; // 한 타임별 수용 인원 수

  @OneToMany(
    () => PopupOperationPolicyDay,
    (day) => day.policy,
    { cascade: true }
  )
  days: PopupOperationPolicyDay[];
}
