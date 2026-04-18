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
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://docxtract.sk-salman.com',
      'https://docxtractor.sk-salman.com',
    ],
    credentials: true,
  },
  namespace: 'runs',
})
export class RunsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RunsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(
          `Disconnecting client ${client.id}: No token provided`,
        );
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      if (payload.type === 'demo') {
        // Demo token: scoped to a single runId
        client.data.demo = { runId: payload.runId };
        this.logger.log(
          `Demo client connected: ${client.id} (run: ${payload.runId})`,
        );
      } else {
        // Standard user token
        client.data.user = payload;
        this.logger.log(
          `Client connected: ${client.id} (user: ${payload.sub})`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `Disconnecting client ${client.id}: Invalid token - ${e.message}`,
      );
      client.disconnect();
    }
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

    // Demo clients: scoped to their specific runId only
    if (client.data.demo) {
      if (client.data.demo.runId !== runId) {
        this.logger.warn(
          `Demo client ${client.id} tried to join unauthorized run: ${runId}`,
        );
        return { event: 'error', data: { message: 'Unauthorized' } };
      }
      client.join(`run:${runId}`);
      return { event: 'joinedRun', data: { runId } };
    }

    if (!client.data.user) {
      this.logger.warn(`Unauthorized joinRun attempt from ${client.id}`);
      return { event: 'error', data: { message: 'Unauthorized' } };
    }
    client.join(`run:${runId}`);
    return { event: 'joinedRun', data: { runId } };
  }

  @SubscribeMessage('leaveRun')
  handleLeaveRun(
    @MessageBody() data: { runId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { runId } = data;
    // this.logger.log(`Client ${client.id} leaving run room: ${runId}`);
    client.leave(`run:${runId}`);
    return { event: 'leftRun', data: { runId } };
  }

  @SubscribeMessage('joinRunsList')
  handleJoinRunsList(@ConnectedSocket() client: Socket) {
    if (!client.data.user) {
      this.logger.warn(`Unauthorized joinRunsList attempt from ${client.id}`);
      return { event: 'error', data: { message: 'Unauthorized' } };
    }
    client.join('runs:list');
    return { event: 'joinedRunsList' };
  }

  @SubscribeMessage('leaveRunsList')
  handleLeaveRunsList(@ConnectedSocket() client: Socket) {
    // this.logger.log(`Client ${client.id} leaving runs list room`);
    client.leave('runs:list');
    return { event: 'leftRunsList' };
  }

  // Helper methods to emit events to room
  emitRunUpdated(runId: string, payload: any) {
    this.server.to(`run:${runId}`).emit('run:updated', payload);
  }

  emitRunSourceUpdated(runId: string, payload: any) {
    this.server.to(`run:${runId}`).emit('run:source:updated', payload);
  }

  emitRunLog(runId: string, log: any) {
    this.server.to(`run:${runId}`).emit('run:log', { runId, log });
  }

  emitRunsListUpdated(payload: {
    runId: string;
    status: string;
    progress?: any;
  }) {
    this.server.to('runs:list').emit('runs:list:updated', payload);
  }

  // Workflow execution events
  @SubscribeMessage('joinWorkflow')
  handleJoinWorkflow(
    @MessageBody() data: { workflowId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!client.data.user) {
      this.logger.warn(`Unauthorized joinWorkflow attempt from ${client.id}`);
      return { event: 'error', data: { message: 'Unauthorized' } };
    }
    const { workflowId } = data;
    client.join(`workflow:${workflowId}`);
    return { event: 'joinedWorkflow', data: { workflowId } };
  }

  @SubscribeMessage('leaveWorkflow')
  handleLeaveWorkflow(
    @MessageBody() data: { workflowId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { workflowId } = data;
    client.leave(`workflow:${workflowId}`);
    return { event: 'leftWorkflow', data: { workflowId } };
  }

  @SubscribeMessage('joinWorkflowExecution')
  handleJoinWorkflowExecution(
    @MessageBody() data: { executionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!client.data.user) {
      this.logger.warn(`Unauthorized joinWorkflowExecution attempt from ${client.id}`);
      return { event: 'error', data: { message: 'Unauthorized' } };
    }
    const { executionId } = data;
    client.join(`workflow-execution:${executionId}`);
    return { event: 'joinedWorkflowExecution', data: { executionId } };
  }

  @SubscribeMessage('leaveWorkflowExecution')
  handleLeaveWorkflowExecution(
    @MessageBody() data: { executionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { executionId } = data;
    client.leave(`workflow-execution:${executionId}`);
    return { event: 'leftWorkflowExecution', data: { executionId } };
  }

  @SubscribeMessage('joinWorkflowsList')
  handleJoinWorkflowsList(@ConnectedSocket() client: Socket) {
    if (!client.data.user) {
      this.logger.warn(`Unauthorized joinWorkflowsList attempt from ${client.id}`);
      return { event: 'error', data: { message: 'Unauthorized' } };
    }
    client.join('workflows:list');
    return { event: 'joinedWorkflowsList' };
  }

  @SubscribeMessage('leaveWorkflowsList')
  handleLeaveWorkflowsList(@ConnectedSocket() client: Socket) {
    client.leave('workflows:list');
    return { event: 'leftWorkflowsList' };
  }

  // Emit workflow events
  emitWorkflowExecutionStarted(execution: any) {
    this.server
      .to(`workflow:${execution.workflowId}`)
      .emit('workflow:execution:started', execution);
    this.server
      .to(`workflow-execution:${execution.id}`)
      .emit('workflow:execution:started', execution);
    this.server.to('workflows:list').emit('workflows:list:updated', {
      workflowId: execution.workflowId,
      executionId: execution.id,
      status: 'started',
    });
  }

  emitWorkflowExecutionCompleted(execution: any) {
    this.server
      .to(`workflow:${execution.workflowId}`)
      .emit('workflow:execution:completed', execution);
    this.server
      .to(`workflow-execution:${execution.id}`)
      .emit('workflow:execution:completed', execution);
    this.server.to('workflows:list').emit('workflows:list:updated', {
      workflowId: execution.workflowId,
      executionId: execution.id,
      status: 'completed',
    });
  }

  emitWorkflowExecutionFailed(execution: any, errorMessage: string) {
    this.server
      .to(`workflow:${execution.workflowId}`)
      .emit('workflow:execution:failed', {
        execution,
        errorMessage,
      });
    this.server
      .to(`workflow-execution:${execution.id}`)
      .emit('workflow:execution:failed', {
        execution,
        errorMessage,
      });
    this.server.to('workflows:list').emit('workflows:list:updated', {
      workflowId: execution.workflowId,
      executionId: execution.id,
      status: 'failed',
      errorMessage,
    });
  }

  emitWorkflowNodeStarted(nodeExecution: any) {
    this.server
      .to(`workflow-execution:${nodeExecution.executionId}`)
      .emit('workflow:node:started', nodeExecution);
  }

  emitWorkflowNodeCompleted(nodeExecution: any) {
    this.server
      .to(`workflow-execution:${nodeExecution.executionId}`)
      .emit('workflow:node:completed', nodeExecution);
  }

  emitWorkflowNodeFailed(nodeExecution: any, errorMessage: string) {
    this.server
      .to(`workflow-execution:${nodeExecution.executionId}`)
      .emit('workflow:node:failed', {
        nodeExecution,
        errorMessage,
      });
  }
}
