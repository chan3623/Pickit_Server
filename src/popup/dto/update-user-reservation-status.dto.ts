import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export enum ReservationStatus {
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export class UpdateReservationStatusDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsEnum(ReservationStatus)
  status: ReservationStatus;
}
