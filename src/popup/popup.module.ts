import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { join } from 'path';
import { PopupDayInfo } from './entities/popup-day-info.entity';
import { PopupReservationInfo } from './entities/popup-reservation-info.entity';
import { PopupReservation } from './entities/popup-reservation.entity';
import { Popup } from './entities/popup.entity';
import { PopupController } from './popup.controller';
import { PopupService } from './popup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Popup,
      PopupDayInfo,
      PopupReservation,
      PopupReservationInfo,
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'temp'),
        filename: (req, file, cb) => {
          const ext = file.originalname.split('.').pop();
          const filename = `${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 8)}.${ext}`;
          cb(null, filename);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'image/jpg',
          'image/jpeg',
          'image/png',
          'image/webp',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
          cb(
            new BadRequestException('JPG, JPEG, PNG, WEBP 이미지만 허용'),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  ],
  controllers: [PopupController],
  providers: [PopupService],
})
export class PopupModule {}
