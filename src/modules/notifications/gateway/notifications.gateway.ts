import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  /**
   * Store connected users
   *
   * userUuid -> socketId
   */
  private connectedUsers = new Map<string, string>();

  /**
   * When user connects
   */
  handleConnection(socket: Socket) {
    console.log(`Socket connected: ${socket.id}`);
  }

  /**
   * When user disconnects
   */
  handleDisconnect(socket: Socket) {
    for (const [userUuid, socketId] of this.connectedUsers.entries()) {
      if (socketId === socket.id) {
        this.connectedUsers.delete(userUuid);

        console.log(`User ${userUuid} disconnected`);

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
    this.connectedUsers.set(data.userUuid, socket.id);

    console.log(
      `User ${data.userUuid} registered with socket ${socket.id}`,
    );

    socket.emit('registered', {
      message: 'Successfully registered for notifications',
    });
  }

  /**
   * Send notification to a specific user
   */
  notifyUser(userUuid: string, notification: any) {
    const socketId = this.connectedUsers.get(userUuid);

    if (!socketId) {
      console.log(
        `User ${userUuid} is not connected`,
      );

      return;
    }

    this.server.to(socketId).emit(
      'notification',
      notification,
    );
  }
}