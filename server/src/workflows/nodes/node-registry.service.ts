import { Injectable } from '@nestjs/common';
import { INode } from './interfaces/node.interface';
import { WebhookTriggerNode } from './triggers/webhook-trigger.node';
import { ScheduleTriggerNode } from './triggers/schedule-trigger.node';
import { ExtractDataNode } from './actions/extract-data.node';
import { SendEmailNode } from './actions/send-email.node';
import { WebhookActionNode } from './actions/webhook-action.node';
import { FilterNode } from './processors/filter-node';

export interface NodeMetadata {
	type: string;
	category: string;
	displayName: string;
	description: string;
	icon?: string;
	schema: any;
}

@Injectable()
export class NodeRegistryService {
	private nodes: Map<string, INode>;

	constructor() {
		this.nodes = new Map();
		this.registerNodes();
	}

	private registerNodes() {
		// Register all available node types
		const nodeInstances: INode[] = [
			// Triggers
			new WebhookTriggerNode(),
			new ScheduleTriggerNode(),

			// Actions
			new ExtractDataNode(),
			new SendEmailNode(),
			new WebhookActionNode(),

			// Processors
			new FilterNode(),
		];

		nodeInstances.forEach((node) => {
			this.nodes.set(node.type, node);
		});
	}

	/**
	 * Get node instance by type
	 */
	getNode(type: string): INode | undefined {
		return this.nodes.get(type);
	}

	/**
	 * Get all available node types with metadata
	 */
	getAllNodeMetadata(): NodeMetadata[] {
		const metadata: NodeMetadata[] = [];

		this.nodes.forEach((node) => {
			metadata.push({
				type: node.type,
				category: node.category,
				displayName: node.displayName,
				description: node.description,
				icon: node.icon,
				schema: node.getParameterSchema(),
			});
		});

		// Sort by category then by display name
		return metadata.sort((a, b) => {
			if (a.category === b.category) {
				return a.displayName.localeCompare(b.displayName);
			}
			return a.category.localeCompare(b.category);
		});
	}

	/**
	 * Get nodes by category
	 */
	getNodesByCategory(category: string): NodeMetadata[] {
		return this.getAllNodeMetadata().filter(
			(node) => node.category === category,
		);
	}

	/**
	 * Validate node configuration
	 */
	validateNodeConfig(
		nodeType: string,
		params: Record<string, any>,
	): string[] | null {
		const node = this.getNode(nodeType);
		if (!node) {
			return [`Unknown node type: ${nodeType}`];
		}

		return node.validate(params);
	}
}
