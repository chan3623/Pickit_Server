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
  slotHours: number; // 2 (2시간 단위)

  @OneToMany(
    () => PopupOperationPolicyDay,
    (day) => day.policy,
    { cascade: true }
  )
  days: PopupOperationPolicyDay[];
}
