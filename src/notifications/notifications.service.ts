// src/notifications/notification.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReservationStatus } from 'src/popup/entities/popup-reservation-info.entity';
import { Repository } from 'typeorm';
import { Notifications } from './entities/notifications.entity';
import { NotificationGateway } from './notifications.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private gateway: NotificationGateway,

    @InjectRepository(Notifications)
    private readonly notificationRepository: Repository<Notifications>,
  ) {}

  async createAndSend(
    userId: number,
    message: string,
    type: ReservationStatus,
  ) {
    const notification = await this.notificationRepository.save({
      userId,
      message,
      type,
    });

    this.gateway.sendNotificationToUser(userId, notification);

    return notification;
  }

  async findUserNotifications(userId: number) {
    return await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number, userId: number) {
    return await this.notificationRepository.update(
      { id, userId },
      { isRead: true },
    );
  }
}
