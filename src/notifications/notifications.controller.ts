import { Controller, Get, Param, Patch } from '@nestjs/common';
import { User } from '../user/decorator/user.decorator';
import { NotificationService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  getNotifications(@User('id') userId: number) {
    return this.notificationService.findUserNotifications(userId);
  }

  @Patch(':id')
  updateNotificationRead(
    @User('id') userId: number,
    @Param('id') notificationId: number,
  ) {
    return this.notificationService.markAsRead(notificationId, userId);
  }
}
