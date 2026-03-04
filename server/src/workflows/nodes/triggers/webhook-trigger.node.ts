import { TriggerNode } from '../base/trigger-node.base';
import {
	JSONSchema,
	ExecutionContext,
	NodeExecutionResult,
} from '../interfaces/node.interface';

export class WebhookTriggerNode extends TriggerNode {
	type = 'webhook_trigger';
	displayName = 'Webhook Trigger';
	description = 'Triggers workflow when webhook receives HTTP POST request';
	icon = 'webhook';

	getParameterSchema(): JSONSchema {
		return {
			type: 'object',
			properties: {
				webhookPath: {
					type: 'string',
					title: 'Webhook Path',
					description: 'URL path for webhook (e.g., /invoice-received)',
					pattern: '^/[a-z0-9-]+$',
				},
			},
			required: ['webhookPath'],
		};
	}

	async execute(
		params: Record<string, any>,
		inputData: any,
		context: ExecutionContext,
	): Promise<NodeExecutionResult> {
		// Webhook triggers don't execute during workflow - they register the webhook
		// The actual trigger happens when webhook receives POST request
		// Pass the webhook payload as output
		return this.success(context.triggerPayload);
	}

	validate(params: Record<string, any>): string[] | null {
		const errors = super.validate(params);
		if (errors) return errors;

		const newErrors: string[] = [];

		// Validate webhook path format
		if (params.webhookPath) {
			if (!params.webhookPath.startsWith('/')) {
				newErrors.push('Webhook path must start with /');
			}
			if (!/^\/[a-z0-9-]+$/.test(params.webhookPath)) {
				newErrors.push(
					'Webhook path can only contain lowercase letters, numbers, and hyphens',
				);
			}
		}

		return newErrors.length > 0 ? newErrors : null;
	}
}
