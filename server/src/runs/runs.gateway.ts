import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'runs',
})
export class RunsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RunsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRun')
  handleJoinRun(
    @MessageBody() data: { runId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { runId } = data;
    this.logger.log(`Client ${client.id} joining run room: ${runId}`);
    client.join(`run:${runId}`);
    return { event: 'joinedRun', data: { runId } };
  }

  @SubscribeMessage('leaveRun')
  handleLeaveRun(
    @MessageBody() data: { runId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { runId } = data;
    this.logger.log(`Client ${client.id} leaving run room: ${runId}`);
    client.leave(`run:${runId}`);
    return { event: 'leftRun', data: { runId } };
  }

  // Helper methods to emit events to room
  emitRunUpdated(runId: string, payload: any) {
    this.server.to(`run:${runId}`).emit('run:updated', payload);
  }

  emitRunSourceUpdated(runId: string, payload: any) {
    this.server.to(`run:${runId}`).emit('run:source:updated', payload);
  }
}
