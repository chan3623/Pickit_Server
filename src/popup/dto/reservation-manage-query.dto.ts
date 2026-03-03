import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class ReservationManageQueryDto {
  @IsString()
  @IsOptional()
  status: string;

  @IsNotEmpty()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
