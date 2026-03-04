import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowExecution } from './entities/workflow-execution.entity';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { WorkflowStatus } from './enums/workflow-status.enum';
import { ExecutionStatus } from './enums/execution-status.enum';

@Injectable()
export class WorkflowsService {
	constructor(
		@InjectRepository(Workflow)
		private workflowRepository: Repository<Workflow>,
		@InjectRepository(WorkflowExecution)
		private workflowExecutionRepository: Repository<WorkflowExecution>,
	) {}

	async create(createWorkflowDto: CreateWorkflowDto, userId: string) {
		// Initialize with empty definition if not provided
		const definition = createWorkflowDto.definition || {
			nodes: [],
			connections: [],
		};

		const workflow = this.workflowRepository.create({
			...createWorkflowDto,
			definition,
			userId,
			status: WorkflowStatus.DRAFT,
		});

		return this.workflowRepository.save(workflow);
	}

	async findAll(userId: string) {
		return this.workflowRepository.find({
			where: { userId },
			order: { createdAt: 'DESC' },
		});
	}

	async findOne(id: string, userId: string) {
		const workflow = await this.workflowRepository.findOne({
			where: { id, userId },
		});

		if (!workflow) {
			throw new NotFoundException(`Workflow with ID ${id} not found`);
		}

		return workflow;
	}

	async update(id: string, updateWorkflowDto: UpdateWorkflowDto, userId: string) {
		const workflow = await this.findOne(id, userId);

		// Validate workflow definition if provided
		if (updateWorkflowDto.definition) {
			this.validateWorkflowDefinition(updateWorkflowDto.definition);
		}

		Object.assign(workflow, updateWorkflowDto);
		return this.workflowRepository.save(workflow);
	}

	async remove(id: string, userId: string) {
		const workflow = await this.findOne(id, userId);

		// Don't allow deleting active workflows
		if (workflow.status === WorkflowStatus.ACTIVE) {
			throw new BadRequestException(
				'Cannot delete an active workflow. Please pause it first.',
			);
		}

		await this.workflowRepository.remove(workflow);
	}

	async activate(id: string, userId: string) {
		const workflow = await this.findOne(id, userId);

		// Validate workflow has nodes and trigger configuration
		if (
			!workflow.definition.nodes ||
			workflow.definition.nodes.length === 0
		) {
			throw new BadRequestException('Workflow must have at least one node');
		}

		if (!workflow.triggerConfig) {
			throw new BadRequestException('Workflow must have a trigger configured');
		}

		// Validate workflow definition
		this.validateWorkflowDefinition(workflow.definition);

		workflow.status = WorkflowStatus.ACTIVE;
		return this.workflowRepository.save(workflow);
	}

	async pause(id: string, userId: string) {
		const workflow = await this.findOne(id, userId);
		workflow.status = WorkflowStatus.PAUSED;
		return this.workflowRepository.save(workflow);
	}

	async getExecutions(workflowId: string, userId: string) {
		// Verify ownership
		await this.findOne(workflowId, userId);

		return this.workflowExecutionRepository.find({
			where: { workflowId },
			order: { createdAt: 'DESC' },
		});
	}

	async triggerManually(id: string, userId: string, payload: any = {}) {
		const workflow = await this.findOne(id, userId);

		// Create execution record
		const execution = this.workflowExecutionRepository.create({
			workflowId: id,
			status: ExecutionStatus.PENDING,
			triggerPayload: payload,
		});

		const savedExecution = await this.workflowExecutionRepository.save(execution);

		// TODO: Queue workflow execution job
		// This will be implemented in Phase 3 when we create the WorkflowExecutorService

		return savedExecution;
	}

	private validateWorkflowDefinition(definition: any) {
		const { nodes, connections } = definition;

		if (!nodes || !Array.isArray(nodes)) {
			throw new BadRequestException('Workflow must have a nodes array');
		}

		if (!connections || !Array.isArray(connections)) {
			throw new BadRequestException('Workflow must have a connections array');
		}

		// Check for orphaned nodes (nodes not connected to anything)
		const connectedNodeIds = new Set<string>();
		connections.forEach((conn) => {
			connectedNodeIds.add(conn.source);
			connectedNodeIds.add(conn.target);
		});

		const orphanedNodes = nodes.filter(
			(node) => !connectedNodeIds.has(node.id) && nodes.length > 1,
		);

		if (orphanedNodes.length > 0 && nodes.length > 1) {
			throw new BadRequestException(
				`Found orphaned nodes: ${orphanedNodes.map((n) => n.id).join(', ')}`,
			);
		}

		// Check for cycles using DFS
		if (this.hasCycle(nodes, connections)) {
			throw new BadRequestException('Workflow contains a cycle');
		}

		// Validate that all connection references exist
		const nodeIds = new Set(nodes.map((n) => n.id));
		connections.forEach((conn) => {
			if (!nodeIds.has(conn.source)) {
				throw new BadRequestException(
					`Connection references non-existent source node: ${conn.source}`,
				);
			}
			if (!nodeIds.has(conn.target)) {
				throw new BadRequestException(
					`Connection references non-existent target node: ${conn.target}`,
				);
			}
		});
	}

	private hasCycle(nodes: any[], connections: any[]): boolean {
		const adjacencyList = new Map<string, string[]>();

		// Build adjacency list
		nodes.forEach((node) => adjacencyList.set(node.id, []));
		connections.forEach((conn) => {
			adjacencyList.get(conn.source)?.push(conn.target);
		});

		const visited = new Set<string>();
		const recStack = new Set<string>();

		const dfs = (nodeId: string): boolean => {
			if (!visited.has(nodeId)) {
				visited.add(nodeId);
				recStack.add(nodeId);

				const neighbors = adjacencyList.get(nodeId) || [];
				for (const neighbor of neighbors) {
					if (!visited.has(neighbor) && dfs(neighbor)) {
						return true;
					} else if (recStack.has(neighbor)) {
						return true; // Cycle detected
					}
				}
			}

			recStack.delete(nodeId);
			return false;
		};

		// Check from each node
		for (const node of nodes) {
			if (dfs(node.id)) {
				return true;
			}
		}

		return false;
	}
}
