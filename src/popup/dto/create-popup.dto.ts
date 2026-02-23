import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

class DayInfoDto {
  @IsNotEmpty()
  dayOfWeek: number;

  @IsString()
  openTime: string;

  @IsString()
  closeTime: string;

  @IsNotEmpty()
  slotMinute: number;

  @IsNotEmpty()
  capacityPerSlot: number;
}

export class CreatePopupDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @Matches(/^01[0-9]{8,9}$/)
  tel: string;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  park: boolean;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isFree: boolean;

  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayInfoDto)
  dayInfos: DayInfoDto[];
}
