import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { PopupService } from './popup.service';

@Controller('popup')
export class PopupController {
  constructor(private readonly popupService: PopupService) {}

  @Get()
  async getPopups() {
    const popupData = await this.popupService.findAll();
    return popupData;
  }

  @Get('random')
  async getRandomPopups() {
    return await this.popupService.findRandomPopups();
  }

  @Get('operation/:id')
  async getPopupOperation(@Param('id') id: string) {
    const popupOperationData = await this.popupService.findPopupOperation(+id);
    return popupOperationData;
  }

  @Get(':id')
  getPopup(@Param('id') id: string) {
    return this.popupService.findOne(+id);
  }

  @Post()
  create(@Body() createPopupDto: CreatePopupDto) {
    return this.popupService.create(createPopupDto);
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
