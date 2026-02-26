import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { ReservationStatus } from '../entities/popup-reservation-info.entity';

export class UpdateUserPopupStatusDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsNotEmpty()
  status: ReservationStatus;
}
