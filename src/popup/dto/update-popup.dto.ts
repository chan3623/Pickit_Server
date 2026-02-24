import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

class UpdateDayInfoDto {
  @IsNumber()
  @IsNotEmpty()
  dayOfWeek: number;

  @IsString()
  @IsNotEmpty()
  openTime: string;

  @IsString()
  @IsNotEmpty()
  closeTime: string;

  @IsNumber()
  @IsNotEmpty()
  slotMinute: number;

  @IsNumber()
  @IsNotEmpty()
  capacityPerSlot: number;
}

export class UpdatePopupDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  id: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  detailAddress?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @Matches(/^01[0-9]{8,9}$/)
  @IsNotEmpty()
  tel: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsNotEmpty()
  park: boolean;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsNotEmpty()
  isFree: boolean;

  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpdateDayInfoDto)
  dayInfos: UpdateDayInfoDto[];
}
