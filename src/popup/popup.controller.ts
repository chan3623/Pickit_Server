import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileNameEncodingInterceptor } from 'src/common/decorator/file.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import { User } from 'src/user/decorator/user.decorator';
import { CreatePopupReservationDto } from './dto/create-popup-reservation.dto';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { PopupService } from './popup.service';

@Controller('popup')
export class PopupController {
  constructor(private readonly popupService: PopupService) {}

  @Public()
  @Get()
  async getPopups() {
    const popupData = await this.popupService.findPopups();
    return popupData;
  }

  @Public()
  @Get('random')
  async getRandomPopups() {
    return await this.popupService.findRandomPopups();
  }

  @Get('reservation')
  getUserReservations(@User('id') userId: number) {
    return this.popupService.findUserReservations(userId);
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

  @Get('manager')
  async getManagerPopups(@User('id') userId: number) {
    return await this.popupService.findManagerPopups(userId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'), FileNameEncodingInterceptor)
  async createPopup(
    @User('id') userId: number,
    @Body() createPopupDto: CreatePopupDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return await this.popupService.createPopup(userId, createPopupDto, image);
  }

  @Post('reservation')
  async createReservation(
    @User('id') userId: number,
    @Body() createPopupReservationDto: CreatePopupReservationDto,
  ) {
    return await this.popupService.createReservation(
      userId,
      createPopupReservationDto,
    );
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'), FileNameEncodingInterceptor)
  async updatePopup(
    @User('id') userId: number,
    @Body() updatePopupDto: UpdatePopupDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return await this.popupService.updatePopup(userId, updatePopupDto, image);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.popupService.remove(+id);
  // }
}
