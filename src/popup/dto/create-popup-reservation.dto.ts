import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePopupReservationDto {
  @IsNumber()
  @IsNotEmpty()
  popupId: number;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @IsNotEmpty()
  dayOfWeek: number;

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsNumber()
  @IsNotEmpty()
  count: number;
}
