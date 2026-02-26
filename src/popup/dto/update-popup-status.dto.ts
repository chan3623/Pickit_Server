import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { PopupStatus } from '../entities/popup.entity';

export class UpdatePopupStatusDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsNotEmpty()
  status: PopupStatus;
}
