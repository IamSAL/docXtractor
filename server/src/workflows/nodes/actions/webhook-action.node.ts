import { Injectable } from '@nestjs/common';
import { ActionNode } from '../base/action-node.base';
import {
	JSONSchema,
	ExecutionContext,
	NodeExecutionResult,
} from '../interfaces/node.interface';

@Injectable()
export class WebhookActionNode extends ActionNode {
	type = 'webhook_action';
	displayName = 'Webhook';
	description = 'Send HTTP POST request to external URL';
	icon = 'webhook-send';

	getParameterSchema(): JSONSchema {
		return {
			type: 'object',
			properties: {
				url: {
					type: 'string',
					title: 'URL',
					description: 'Target webhook URL',
					format: 'url',
				},
				headers: {
					type: 'object',
					title: 'Headers',
					description: 'HTTP headers (optional)',
					additionalProperties: {
						type: 'string',
					},
					default: {},
				},
				includeResults: {
					type: 'boolean',
					title: 'Include Results in Body',
					description: 'Send extraction results in request body',
					default: true,
				},
			},
			required: ['url'],
		};
	}

	async execute(
		params: Record<string, any>,
		inputData: any,
		context: ExecutionContext,
	): Promise<NodeExecutionResult> {
		try {
			// Prepare request body
			const body = params.includeResults
				? {
						workflowId: context.workflowId,
						executionId: context.executionId,
						results: inputData,
						timestamp: new Date().toISOString(),
					}
				: {
						workflowId: context.workflowId,
						executionId: context.executionId,
						timestamp: new Date().toISOString(),
					};

			// TODO: This will be implemented in Phase 10 with actual HTTP client
			// For now, return a placeholder
			return this.success({
				status: 'sent',
				url: params.url,
				statusCode: 200,
				message: 'Webhook POST will be implemented in Phase 10',
			});
		} catch (error) {
			return this.error(`Failed to send webhook: ${error.message}`);
		}
	}

	validate(params: Record<string, any>): string[] | null {
		const errors = super.validate(params);
		if (errors) return errors;

		const newErrors: string[] = [];

		// Validate URL format
		if (params.url) {
			try {
				new URL(params.url);
			} catch {
				newErrors.push('Invalid URL format');
			}
		}

		return newErrors.length > 0 ? newErrors : null;
	}
}
