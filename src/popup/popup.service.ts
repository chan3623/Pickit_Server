import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { Popup } from './entities/popup.entity';

@Injectable()
export class PopupService {
  constructor(
    @InjectRepository(Popup)
    private readonly popupRepository: Repository<Popup>,
  ) {}

  create(createPopupDto: CreatePopupDto) {
    return 'This action adds a new popup';
  }

  async findAll() {
    return await this.popupRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} popup`;
  }

  update(id: number, updatePopupDto: UpdatePopupDto) {
    return `This action updates a #${id} popup`;
  }

  remove(id: number) {
    return `This action removes a #${id} popup`;
  }
}
