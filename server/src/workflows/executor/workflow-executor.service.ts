import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowExecution } from '../entities/workflow-execution.entity';
import { NodeExecution } from '../entities/node-execution.entity';
import { Workflow } from '../entities/workflow.entity';
import { ExecutionStatus } from '../enums/execution-status.enum';
import { NodeExecutionStatus } from '../enums/node-execution-status.enum';
import { NodeRegistryService } from '../nodes/node-registry.service';
import { RunsGateway } from '../../runs/runs.gateway';
import { QueueService } from '../../shared/queue/queue.service';
import { FilesService } from '../../files/files.service';
import { RunsService } from '../../runs/runs.service';
import { MailService } from '../../shared/mail/mail.service';

interface ExecutionContext {
	executionId: string;
	workflowId: string;
	userId: string;
	triggerPayload: any;
	nodeOutputs: Map<string, any>;
	variables: Record<string, any>;
	queueService: QueueService;
	filesService: FilesService;
	runsService: RunsService;
	mailService: MailService;
}

interface GraphNode {
	id: string;
	type: string;
	params: Record<string, any>;
	dependencies: string[];
}

@Injectable()
export class WorkflowExecutorService {
	private readonly logger = new Logger(WorkflowExecutorService.name);

	constructor(
		@InjectRepository(WorkflowExecution)
		private workflowExecutionRepo: Repository<WorkflowExecution>,
		@InjectRepository(NodeExecution)
		private nodeExecutionRepo: Repository<NodeExecution>,
		@InjectRepository(Workflow)
		private workflowRepo: Repository<Workflow>,
		private nodeRegistry: NodeRegistryService,
		private runsGateway: RunsGateway,
		private queueService: QueueService,
		private filesService: FilesService,
		private runsService: RunsService,
		private mailService: MailService,
	) {}

	/**
	 * Main entry point for workflow execution
	 */
	async executeWorkflow(
		workflowId: string,
		triggerPayload: any,
	): Promise<WorkflowExecution> {
		this.logger.log(`Starting execution for workflow ${workflowId}`);

		// Load workflow
		const workflow = await this.workflowRepo.findOne({
			where: { id: workflowId },
			relations: ['user'],
		});

		if (!workflow) {
			throw new Error(`Workflow ${workflowId} not found`);
		}

		// Create execution record
		const execution = this.workflowExecutionRepo.create({
			workflowId,
			status: ExecutionStatus.PENDING,
			triggerPayload,
			startedAt: new Date(),
		});
		await this.workflowExecutionRepo.save(execution);

		// Emit WebSocket event
		this.runsGateway.emitWorkflowExecutionStarted(execution);

		try {
			// Build execution graph
			const graph = this.buildExecutionGraph(workflow.definition);

			// Validate graph (check for cycles)
			if (this.hasCycle(graph)) {
				throw new Error('Workflow contains cycles');
			}

			// Perform topological sort
			const executionOrder = this.topologicalSort(graph);

			// Create execution context
			const context: ExecutionContext = {
				executionId: execution.id,
				workflowId: workflow.id,
				userId: workflow.userId,
				triggerPayload,
				nodeOutputs: new Map(),
				variables: {},
				queueService: this.queueService,
				filesService: this.filesService,
				runsService: this.runsService,
				mailService: this.mailService,
			};

			// Update status to RUNNING
			execution.status = ExecutionStatus.RUNNING;
			await this.workflowExecutionRepo.save(execution);

			// Execute nodes in order
			for (const nodeId of executionOrder) {
				const node = graph.get(nodeId);
				if (!node) continue;

				await this.executeNode(node, context);
			}

			// Mark execution as successful
			execution.status = ExecutionStatus.SUCCESS;
			execution.completedAt = new Date();
			execution.executionData = Object.fromEntries(context.nodeOutputs);
			await this.workflowExecutionRepo.save(execution);

			this.runsGateway.emitWorkflowExecutionCompleted(execution);
			this.logger.log(`Workflow ${workflowId} executed successfully`);

			return execution;
		} catch (error) {
			this.logger.error(
				`Workflow ${workflowId} execution failed:`,
				error.stack,
			);

			execution.status = ExecutionStatus.FAILED;
			execution.completedAt = new Date();
			execution.errorMessage = error.message;
			await this.workflowExecutionRepo.save(execution);

			this.runsGateway.emitWorkflowExecutionFailed(execution, error.message);

			throw error;
		}
	}

	/**
	 * Build execution graph from workflow definition
	 */
	private buildExecutionGraph(
		definition: any,
	): Map<string, GraphNode> {
		const graph = new Map<string, GraphNode>();

		// Add all nodes
		for (const node of definition.nodes) {
			graph.set(node.id, {
				id: node.id,
				type: node.type,
				params: node.params || {},
				dependencies: [],
			});
		}

		// Add dependencies based on connections
		for (const connection of definition.connections) {
			const targetNode = graph.get(connection.target);
			if (targetNode) {
				targetNode.dependencies.push(connection.source);
			}
		}

		return graph;
	}

	/**
	 * Check if graph contains cycles using DFS
	 */
	private hasCycle(graph: Map<string, GraphNode>): boolean {
		const visited = new Set<string>();
		const recursionStack = new Set<string>();

		const dfs = (nodeId: string): boolean => {
			visited.add(nodeId);
			recursionStack.add(nodeId);

			const node = graph.get(nodeId);
			if (node) {
				for (const depId of node.dependencies) {
					if (!visited.has(depId)) {
						if (dfs(depId)) return true;
					} else if (recursionStack.has(depId)) {
						return true; // Cycle detected
					}
				}
			}

			recursionStack.delete(nodeId);
			return false;
		};

		for (const nodeId of graph.keys()) {
			if (!visited.has(nodeId)) {
				if (dfs(nodeId)) return true;
			}
		}

		return false;
	}

	/**
	 * Topological sort using Kahn's algorithm
	 */
	private topologicalSort(graph: Map<string, GraphNode>): string[] {
		const inDegree = new Map<string, number>();
		const result: string[] = [];
		const queue: string[] = [];

		// Calculate in-degree for each node
		for (const [nodeId, node] of graph) {
			if (!inDegree.has(nodeId)) {
				inDegree.set(nodeId, 0);
			}
			for (const depId of node.dependencies) {
				inDegree.set(depId, (inDegree.get(depId) || 0));
				inDegree.set(nodeId, (inDegree.get(nodeId) || 0) + 1);
			}
		}

		// Find all nodes with in-degree 0 (trigger nodes)
		for (const [nodeId, degree] of inDegree) {
			if (degree === 0) {
				queue.push(nodeId);
			}
		}

		// Process nodes in order
		while (queue.length > 0) {
			const nodeId = queue.shift()!;
			result.push(nodeId);

			// Reduce in-degree for dependent nodes
			for (const [otherId, otherNode] of graph) {
				if (otherNode.dependencies.includes(nodeId)) {
					const newDegree = (inDegree.get(otherId) || 0) - 1;
					inDegree.set(otherId, newDegree);
					if (newDegree === 0) {
						queue.push(otherId);
					}
				}
			}
		}

		return result;
	}

	/**
	 * Execute a single node
	 */
	private async executeNode(
		node: GraphNode,
		context: ExecutionContext,
	): Promise<void> {
		this.logger.log(
			`Executing node ${node.id} (${node.type}) in workflow ${context.workflowId}`,
		);

		// Create node execution record
		const nodeExecution = this.nodeExecutionRepo.create({
			executionId: context.executionId,
			nodeId: node.id,
			nodeType: node.type,
			status: NodeExecutionStatus.PENDING,
		});
		await this.nodeExecutionRepo.save(nodeExecution);

		// Emit WebSocket event
		this.runsGateway.emitWorkflowNodeStarted(nodeExecution);

		try {
			// Update status to RUNNING
			nodeExecution.status = NodeExecutionStatus.RUNNING;
			nodeExecution.startedAt = new Date();
			await this.nodeExecutionRepo.save(nodeExecution);

			// Gather input data from dependencies
			const inputData = this.gatherInputData(node, context);
			nodeExecution.inputData = inputData;
			await this.nodeExecutionRepo.save(nodeExecution);

			// Get node implementation from registry
			const nodeImpl = this.nodeRegistry.getNode(node.type);
			if (!nodeImpl) {
				throw new Error(`Node type ${node.type} not found in registry`);
			}

			// Validate node parameters
			const validationErrors = nodeImpl.validate(node.params);
			if (validationErrors && validationErrors.length > 0) {
				throw new Error(
					`Node validation failed: ${validationErrors.join(', ')}`,
				);
			}

			// Execute node with retry logic
			let lastError: Error | null = null;
			const maxRetries = 3;

			for (let attempt = 1; attempt <= maxRetries; attempt++) {
				try {
					const result = await nodeImpl.execute(node.params, inputData, context);

					// Store output
					context.nodeOutputs.set(node.id, result.outputData);
					nodeExecution.outputData = result.outputData;
					nodeExecution.status = NodeExecutionStatus.SUCCESS;
					nodeExecution.completedAt = new Date();
					nodeExecution.durationMs =
						nodeExecution.completedAt.getTime() -
						nodeExecution.startedAt.getTime();
					await this.nodeExecutionRepo.save(nodeExecution);

					this.runsGateway.emitWorkflowNodeCompleted(nodeExecution);
					this.logger.log(`Node ${node.id} executed successfully`);

					return;
				} catch (error) {
					lastError = error;
					this.logger.warn(
						`Node ${node.id} attempt ${attempt}/${maxRetries} failed: ${error.message}`,
					);

					if (attempt < maxRetries) {
						// Exponential backoff: 1s, 2s, 4s
						await new Promise((resolve) =>
							setTimeout(resolve, Math.pow(2, attempt - 1) * 1000),
						);
					}
				}
			}

			// All retries failed
			throw lastError;
		} catch (error) {
			this.logger.error(`Node ${node.id} execution failed:`, error.stack);

			nodeExecution.status = NodeExecutionStatus.FAILED;
			nodeExecution.completedAt = new Date();
			nodeExecution.errorMessage = error.message;
			nodeExecution.durationMs = nodeExecution.startedAt
				? nodeExecution.completedAt.getTime() - nodeExecution.startedAt.getTime()
				: 0;
			await this.nodeExecutionRepo.save(nodeExecution);

			this.runsGateway.emitWorkflowNodeFailed(nodeExecution, error.message);

			throw error;
		}
	}

	/**
	 * Gather input data from upstream nodes
	 */
	private gatherInputData(
		node: GraphNode,
		context: ExecutionContext,
	): any {
		if (node.dependencies.length === 0) {
			// Trigger node - use trigger payload
			return context.triggerPayload;
		}

		if (node.dependencies.length === 1) {
			// Single dependency - return its output directly
			return context.nodeOutputs.get(node.dependencies[0]);
		}

		// Multiple dependencies - return as object with nodeId keys
		const inputData: Record<string, any> = {};
		for (const depId of node.dependencies) {
			inputData[depId] = context.nodeOutputs.get(depId);
		}
		return inputData;
	}
}
