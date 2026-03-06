import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from 'src/common/const/roles.enum';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { FileNameEncodingInterceptor } from '../common/decorator/file.decorator';
import { Public } from '../common/decorator/public.decorator';
import { User } from '../user/decorator/user.decorator';
import { CreatePopupReservationDto } from './dto/create-popup-reservation.dto';
import { CreatePopupDto } from './dto/create-popup.dto';
import { ReservationManageQueryDto } from './dto/reservation-manage-query.dto';
import { UpdatePopupCancelDto } from './dto/update-popup-cancel.dto';
import { UpdatePopupStatusDto } from './dto/update-popup-status.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { UpdateUserPopupStatusDto } from './dto/update-user-popup-status.dto';
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

  @Get('reservationManage/:id')
  async getReservationManage(
    @User('id') userId: number,
    @Param('id') popupId: number,
    @Query() query: ReservationManageQueryDto,
  ) {
    return await this.popupService.findReservationManage(
      userId,
      popupId,
      query,
    );
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
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

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch()
  @UseInterceptors(FileInterceptor('image'), FileNameEncodingInterceptor)
  async updatePopup(
    @User('id') userId: number,
    @Body() updatePopupDto: UpdatePopupDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return await this.popupService.updatePopup(userId, updatePopupDto, image);
  }

  @Patch('cancel-user')
  async cancelUserReservation(
    @User('id') userId: number,
    @Body() updateUserPopupStatusDto: UpdateUserPopupStatusDto,
  ) {
    return await this.popupService.cancelUserReservation(
      userId,
      updateUserPopupStatusDto,
    );
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch('early-close')
  async popupEarlyClosed(
    @User('id') userId: number,
    @Body() updatePopupStatusDto: UpdatePopupStatusDto,
  ) {
    return await this.popupService.popupEarlyClosed(
      userId,
      updatePopupStatusDto,
    );
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch('cancel-popup')
  async popupCancel(
    @User('id') userId: number,
    @Body() updatePopupCancelDto: UpdatePopupCancelDto,
  ) {
    return await this.popupService.popupCancel(userId, updatePopupCancelDto);
  }
}
