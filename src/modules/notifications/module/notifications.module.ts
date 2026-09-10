import { Module } from '@nestjs/common';

import { NotificationsGateway } from '../gateway/notifications.gateway';
import { NotificationsService } from '../service/notifications.service';

@Module({
  providers: [
    NotificationsGateway,
    NotificationsService,
  ],
  exports: [
    NotificationsGateway,
    NotificationsService,
  ],
})
export class NotificationsModule {}