// src/notifications/notification.gateway.ts
import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { envVariablesKeys } from 'src/common/const/env.const';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env[envVariablesKeys.clientUrl] || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<number, string>();

  handleConnection(client: Socket) {
    const userId = Number(client.handshake.query.userId);
    if (userId) {
      this.userSockets.set(userId, client.id);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Number(client.handshake.query.userId);
    if (userId) this.userSockets.delete(userId);
  }

  sendNotificationToUser(userId: number, message: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', message);
    }
  }
}
