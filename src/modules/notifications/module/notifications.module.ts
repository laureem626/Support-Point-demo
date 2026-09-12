import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Notification } from '../entities/notifications.entity';
import { NotificationsService } from '../service/notifications.service';
import { NotificationsGateway } from '../gateway/notifications.gateway';
import { NotificationsController } from '../controller/notifications.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
  ],

  controllers: [
    NotificationsController,
  ],

  providers: [
    NotificationsService,
    NotificationsGateway,
  ],

  exports: [
    NotificationsService,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}
