import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
	Request,
} from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { AccessTokenGuard } from '../shared/auth/guards/access-token.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NodeRegistryService } from './nodes/node-registry.service';

@ApiTags('workflows')
@ApiBearerAuth()
@Controller('workflows')
@UseGuards(AccessTokenGuard)
export class WorkflowsController {
	constructor(
		private readonly workflowsService: WorkflowsService,
		private readonly nodeRegistryService: NodeRegistryService,
	) {}

	@Post()
	@ApiOperation({ summary: 'Create a new workflow' })
	create(@Body() createWorkflowDto: CreateWorkflowDto, @Request() req) {
		return this.workflowsService.create(createWorkflowDto, req.user.sub);
	}

	@Get()
	@ApiOperation({ summary: 'Get all workflows for the current user' })
	findAll(@Request() req) {
		return this.workflowsService.findAll(req.user.sub);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a specific workflow' })
	findOne(@Param('id') id: string, @Request() req) {
		return this.workflowsService.findOne(id, req.user.sub);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update a workflow' })
	update(
		@Param('id') id: string,
		@Body() updateWorkflowDto: UpdateWorkflowDto,
		@Request() req,
	) {
		return this.workflowsService.update(id, updateWorkflowDto, req.user.sub);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a workflow' })
	remove(@Param('id') id: string, @Request() req) {
		return this.workflowsService.remove(id, req.user.sub);
	}

	@Post(':id/activate')
	@ApiOperation({ summary: 'Activate a workflow' })
	activate(@Param('id') id: string, @Request() req) {
		return this.workflowsService.activate(id, req.user.sub);
	}

	@Post(':id/pause')
	@ApiOperation({ summary: 'Pause a workflow' })
	pause(@Param('id') id: string, @Request() req) {
		return this.workflowsService.pause(id, req.user.sub);
	}

	@Get(':id/executions')
	@ApiOperation({ summary: 'Get execution history for a workflow' })
	getExecutions(@Param('id') id: string, @Request() req) {
		return this.workflowsService.getExecutions(id, req.user.sub);
	}

	@Post(':id/trigger')
	@ApiOperation({ summary: 'Manually trigger a workflow' })
	trigger(@Param('id') id: string, @Body() payload: any, @Request() req) {
		return this.workflowsService.triggerManually(id, req.user.sub, payload);
	}

	@Get('nodes/metadata')
	@ApiOperation({ summary: 'Get all available node types with metadata' })
	getNodeMetadata() {
		return this.nodeRegistryService.getAllNodeMetadata();
	}
}
