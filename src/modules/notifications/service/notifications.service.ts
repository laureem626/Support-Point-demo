import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from '../entities/notifications.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Create a new notification
   */
  async createNotification(data: {
    userUuid: string;
    issueUuid: string;
    issueNumber: string;
    type: string;
    title: string;
    message: string;
  }) {
    const notification =
      this.notificationRepository.create({
        userUuid: data.userUuid,
        issueUuid: data.issueUuid,
        issueNumber: data.issueNumber,
        type: data.type,
        title: data.title,
        message: data.message,

        isRead: false,
        isActive: true,
        readAt: null,
      });

    return this.notificationRepository.save(
      notification,
    );
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationUuid: string) {
    const notification =
      await this.notificationRepository.findOne({
        where: {
          uuid: notificationUuid,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found',
      );
    }

    notification.isRead = true;
    notification.readAt = new Date();

    return this.notificationRepository.save(
      notification,
    );
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(notificationUuid: string) {
    const notification =
      await this.notificationRepository.findOne({
        where: {
          uuid: notificationUuid,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found',
      );
    }

    notification.isRead = false;
    notification.readAt = null;

    return this.notificationRepository.save(
      notification,
    );
  }

  /**
   * Deactivate notification when
   * issue is assigned to another user.
   */
  async deactivateByIssue(
    issueUuid: string,
    userUuid: string,
  ) {
    await this.notificationRepository.update(
      {
        issueUuid,
        userUuid,
        isActive: true,
      },
      {
        isActive: false,
      },
    );
  }

  /**
   * Get all active notifications
   * belonging to a user.
   */
  async getUserNotifications(
    userUuid: string,
  ) {
    return this.notificationRepository.find({
      where: {
        userUuid,
        isActive: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(
    userUuid: string,
  ) {
    return this.notificationRepository.count({
      where: {
        userUuid,
        isRead: false,
        isActive: true,
      },
    });
  }
}

