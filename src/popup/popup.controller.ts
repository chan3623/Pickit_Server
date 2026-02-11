import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Public } from 'src/common/decorator/public.decorator';
import { User } from 'src/user/decorator/user.decorator';
import { CreatePopupReservationDto } from './dto/create-popup-reservation.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { PopupService } from './popup.service';

@Controller('popup')
export class PopupController {
  constructor(private readonly popupService: PopupService) {}

  @Public()
  @Get()
  async getPopups() {
    const popupData = await this.popupService.findAll();
    return popupData;
  }

  @Public()
  @Get('random')
  async getRandomPopups() {
    return await this.popupService.findRandomPopups();
  }

  @Public()
  @Get('reservation/:id')
  async getPopupReservation(@Param('id') id: number) {
    return await this.popupService.findPopupReservation(id);
  }

  @Public()
  @Get('detail/:id')
  async getPopupDetail(@Param('id') id: number) {
    return await this.popupService.findPopupDetail(id);
  }

  @Post('reservation')
  async createReservation(
    @User('id') userId: number,
    @Body() createPopupReservationDto: CreatePopupReservationDto,
  ) {
    return this.popupService.createReservation(
      userId,
      createPopupReservationDto,
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePopupDto: UpdatePopupDto) {
    return this.popupService.update(+id, updatePopupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.popupService.remove(+id);
  }
}
