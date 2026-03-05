import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { Workflow } from './entities/workflow.entity';
import { WorkflowExecution } from './entities/workflow-execution.entity';
import { NodeExecution } from './entities/node-execution.entity';
import { NodeRegistryService } from './nodes/node-registry.service';
import { WorkflowExecutorService } from './executor/workflow-executor.service';
import { WorkflowExecutionsConsumer } from './consumers/workflow-executions.consumer';
import { TriggerManagerService } from './triggers/trigger-manager.service';
import { WebhookTriggerController } from './triggers/webhook-trigger.controller';
import { RunsModule } from '../runs/runs.module';
import { QueueModule } from '../shared/queue/queue.module';
import { FilesModule } from '../files/files.module';
import { MailModule } from '../shared/mail/mail.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Workflow, WorkflowExecution, NodeExecution]),
		RunsModule,
		QueueModule,
		FilesModule,
		MailModule,
	],
	controllers: [WorkflowsController, WebhookTriggerController],
	providers: [
		WorkflowsService,
		NodeRegistryService,
		WorkflowExecutorService,
		WorkflowExecutionsConsumer,
		TriggerManagerService,
	],
	exports: [WorkflowsService, NodeRegistryService, WorkflowExecutorService],
})
export class WorkflowsModule {}
