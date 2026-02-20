import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreatePopupDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @Matches(/^01[0-9]{8,9}$/)
  tel: string;

  @IsBoolean()
  park: boolean;

  @IsBoolean()
  isFree: boolean;
}
