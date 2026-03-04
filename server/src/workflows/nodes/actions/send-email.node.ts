import { Injectable } from '@nestjs/common';
import { ActionNode } from '../base/action-node.base';
import {
	JSONSchema,
	ExecutionContext,
	NodeExecutionResult,
} from '../interfaces/node.interface';

@Injectable()
export class SendEmailNode extends ActionNode {
	type = 'send_email';
	displayName = 'Send Email';
	description = 'Send email with extraction results';
	icon = 'envelope';

	getParameterSchema(): JSONSchema {
		return {
			type: 'object',
			properties: {
				to: {
					type: 'string',
					title: 'To',
					description: 'Recipient email address',
					format: 'email',
				},
				subject: {
					type: 'string',
					title: 'Subject',
					description: 'Email subject (supports {{variable}} syntax)',
					default: 'Extraction Results',
				},
				body: {
					type: 'string',
					title: 'Body',
					description: 'Email body (supports {{variable}} syntax)',
					format: 'textarea',
					default: 'Extraction completed. Results: {{results}}',
				},
				attachResults: {
					type: 'boolean',
					title: 'Attach Results as JSON',
					description: 'Attach extraction results as JSON file',
					default: false,
				},
			},
			required: ['to', 'subject', 'body'],
		};
	}

	async execute(
		params: Record<string, any>,
		inputData: any,
		context: ExecutionContext,
	): Promise<NodeExecutionResult> {
		try {
			// Replace template variables in subject and body
			const subject = this.replaceVariables(params.subject, inputData, context);
			const body = this.replaceVariables(params.body, inputData, context);

			// TODO: This will be implemented in Phase 10 when we integrate with MailService
			// For now, return a placeholder
			return this.success({
				status: 'sent',
				to: params.to,
				subject,
				body: body.substring(0, 100) + '...',
				message: 'Email sending will be implemented in Phase 10',
			});
		} catch (error) {
			return this.error(`Failed to send email: ${error.message}`);
		}
	}

	private replaceVariables(
		template: string,
		inputData: any,
		context: ExecutionContext,
	): string {
		let result = template;

		// Replace {{results}} with JSON stringified input data
		result = result.replace(
			/\{\{results\}\}/g,
			JSON.stringify(inputData, null, 2),
		);

		// Replace {{variable}} with context variables
		if (context.variables) {
			Object.keys(context.variables).forEach((key) => {
				const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
				result = result.replace(regex, context.variables[key]);
			});
		}

		// Replace {{timestamp}} with current timestamp
		result = result.replace(/\{\{timestamp\}\}/g, new Date().toISOString());

		return result;
	}

	validate(params: Record<string, any>): string[] | null {
		const errors = super.validate(params);
		if (errors) return errors;

		const newErrors: string[] = [];

		// Validate email format
		if (params.to) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(params.to)) {
				newErrors.push('Invalid email address format');
			}
		}

		return newErrors.length > 0 ? newErrors : null;
	}
}
