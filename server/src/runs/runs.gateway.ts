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
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://docxtract.sk-salman.com',
      'https://docxtractor.sk-salman.com',
      'https://docxtractor-stage.sk-salman.com',
    ],
    credentials: true,
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
    // this.logger.log(`Client ${client.id} joining run room: ${runId}`);
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
    // this.logger.log(`Client ${client.id} joining runs list room`);
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
