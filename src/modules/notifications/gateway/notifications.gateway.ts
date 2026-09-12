import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { NotificationsService } from '../service/notifications.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>();

  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * When user connects
   */
  handleConnection(socket: Socket) {
    console.log(
      `Socket connected: ${socket.id}`,
    );
  }

  /**
   * When user disconnects
   */
  handleDisconnect(socket: Socket) {
    for (const [
      userUuid,
      socketId,
    ] of this.connectedUsers.entries()) {
      if (socketId === socket.id) {
        this.connectedUsers.delete(userUuid);

        console.log(
          `User ${userUuid} disconnected`,
        );

        break;
      }
    }
  }

  /**
   * Register logged-in user
   */
  @SubscribeMessage('register')
  registerUser(
    @MessageBody() data: { userUuid: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.connectedUsers.set(
      data.userUuid,
      socket.id,
    );

    console.log(
      `User ${data.userUuid} registered with socket ${socket.id}`,
    );

    socket.emit('registered', {
      message:
        'Successfully registered for notifications',
    });
  }

  /**
   * Create and send notification
   */

async notifyUser(
  userUuid: string,
  notificationData: {
    type: string;
    title: string;
    message: string;
    issueUuid: string;
    issueNumber: string;
  },
) {
  // Save notification in database
const notification =
  await this.notificationsService.createNotification({
    userUuid,
    issueUuid: notificationData.issueUuid,
    issueNumber: notificationData.issueNumber,
    type: notificationData.type,
    title: notificationData.title,
    message: notificationData.message,
  });



  // Find user's socket
  const socketId =
    this.connectedUsers.get(userUuid);

  if (!socketId) {
    console.log(
      `User ${userUuid} is not connected`,
    );

    return notification;
  }

  // Send notification through WebSocket
  this.server.to(socketId).emit('notification', {
    ...notificationData,

    // Database values
    uuid: notification.uuid,
    isRead: notification.isRead,
    isActive: notification.isActive,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  });

  return notification;
}



  /**
   * User clicks notification
   *
   * NO HTTP ENDPOINT REQUIRED
   */
  @SubscribeMessage('mark-notification-read')
  async markNotificationAsRead(
    @MessageBody()
    data: {
      notificationUuid: string;
    },
    @ConnectedSocket() socket: Socket,
  ) {
    const notification =
      await this.notificationsService.markAsRead(
        data.notificationUuid,
      );

    /**
     * Tell frontend that notification
     * has been read.
     */
    socket.emit('notification-read', {
      notificationUuid:
        notification.uuid,
      isRead: true,
      readAt: notification.readAt,
    });
  }

  /**
   * Deactivate notification when
   * issue is assigned to another user.
   */
  async removeNotification(
    userUuid: string,
    issueUuid: string,
  ) {
    await this.notificationsService.deactivateByIssue(
      issueUuid,
      userUuid,
    );

    const socketId =
      this.connectedUsers.get(userUuid);

    if (!socketId) {
      return;
    }

    /**
     * Tell frontend to remove it immediately.
     */
    this.server.to(socketId).emit(
      'remove-notification',
      {
        issueUuid,
      },
    );
  }
}

