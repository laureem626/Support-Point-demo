import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/dashboard',
})
export class DashboardGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // Optionally automatically send stats on connection
  }

  // Helper method to emit updated stats to all connected dashboard clients
  sendDashboardStats(stats: any) {
    this.server.emit('dashboardStats', stats);
  }

  @SubscribeMessage('requestDashboardStats')
  handleRequestStats(client: Socket) {
    // Client explicitly requests a refresh
    client.emit('getStats');
  }
}