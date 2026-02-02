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

  @Get('operation/:id')
  async getPopupOperation(@Param('id') id: string) {
    const popupOperationData = await this.popupService.findPopupByOperation(+id);
    return popupOperationData;
  }

  @Post()
  create(@Body() createPopupDto: CreatePopupDto) {
    return this.popupService.create(createPopupDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.popupService.findOne(+id);
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
