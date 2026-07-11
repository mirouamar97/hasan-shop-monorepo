import { Module } from '@nestjs/common';
import { AdminNotificationTemplatesController } from './admin-notification-templates.controller';
import { NotificationsModule } from '../../../application/notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [NotificationsModule, AuthModule],
  controllers: [AdminNotificationTemplatesController],
})
export class NotificationTemplatesModule {}
