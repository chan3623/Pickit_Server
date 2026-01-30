import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Popup } from './entities/popup.entity';
import { PopupController } from './popup.controller';
import { PopupService } from './popup.service';

@Module({
  imports: [TypeOrmModule.forFeature([Popup])],
  controllers: [PopupController],
  providers: [PopupService],
})
export class PopupModule {}
