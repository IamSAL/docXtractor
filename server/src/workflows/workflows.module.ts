import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { Workflow } from './entities/workflow.entity';
import { WorkflowExecution } from './entities/workflow-execution.entity';
import { NodeExecution } from './entities/node-execution.entity';
import { NodeRegistryService } from './nodes/node-registry.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Workflow, WorkflowExecution, NodeExecution]),
	],
	controllers: [WorkflowsController],
	providers: [WorkflowsService, NodeRegistryService],
	exports: [WorkflowsService, NodeRegistryService],
})
export class WorkflowsModule {}
