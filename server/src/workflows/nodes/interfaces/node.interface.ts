import { NodeCategory } from '../../enums/node-category.enum';

export interface NodeExecutionResult {
	success: boolean;
	outputData?: any;
	error?: string;
}

export interface ExecutionContext {
	executionId: string;
	workflowId: string;
	userId: string;
	triggerPayload: any;
	nodeOutputs: Map<string, any>;
	variables: Record<string, any>;
	runsService?: any;
	queueService?: any;
}

export interface JSONSchema {
	type: string;
	properties?: Record<string, any>;
	required?: string[];
	[key: string]: any;
}

export interface INode {
	type: string;
	category: NodeCategory;
	displayName: string;
	description: string;
	icon?: string;

	/**
	 * Returns JSON Schema for node configuration parameters
	 */
	getParameterSchema(): JSONSchema;

	/**
	 * Execute the node logic
	 * @param params - Node configuration parameters
	 * @param inputData - Data from upstream nodes
	 * @param context - Execution context
	 */
	execute(
		params: Record<string, any>,
		inputData: any,
		context: ExecutionContext,
	): Promise<NodeExecutionResult>;

	/**
	 * Validate node configuration
	 * @param params - Node parameters to validate
	 * @returns Array of error messages, or null if valid
	 */
	validate(params: Record<string, any>): string[] | null;
}
