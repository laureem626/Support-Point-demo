import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import  type { Request } from 'express';

import { NotificationsService } from '../service/notifications.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @ApiOperation({ summary: 'Retrieve user notifications' })
  @Get()
  async getNotifications(@Req() req: Request) {
    const userUuid = (req.user as any).uuid;

    const notifications =
      await this.notificationsService.getUserNotifications(
        userUuid,
      );

    return {
      statusCode: 200,
      message: 'Notifications retrieved successfully',
      data: notifications,
    };
  }
}

