import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('stats')
  getConnectionStats() {
    return this.notificationsService.getConnectionStats();
  }

  @Post('test')
  async sendTestNotifications() {
    await this.notificationsService.sendTestNotifications();
    return { message: 'Test notifications sent' };
  }
}