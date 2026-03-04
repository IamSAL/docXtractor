import { Injectable } from '@nestjs/common';
import { ActionNode } from '../base/action-node.base';
import {
	JSONSchema,
	ExecutionContext,
	NodeExecutionResult,
} from '../interfaces/node.interface';

@Injectable()
export class ExtractDataNode extends ActionNode {
	type = 'extract_data';
	displayName = 'Extract Data';
	description =
		'Extract structured data from documents using AI extraction';
	icon = 'document-scanner';

	getParameterSchema(): JSONSchema {
		return {
			type: 'object',
			properties: {
				extractorId: {
					type: 'string',
					title: 'Extractor',
					description: 'Select which extractor to use',
					format: 'uuid',
				},
				processingMode: {
					type: 'string',
					title: 'Processing Mode',
					description: 'How to process multiple documents',
					enum: ['unified', 'per_document'],
					default: 'unified',
				},
				waitForCompletion: {
					type: 'boolean',
					title: 'Wait for Completion',
					description: 'Wait for extraction to complete before continuing',
					default: true,
				},
			},
			required: ['extractorId'],
		};
	}

	async execute(
		params: Record<string, any>,
		inputData: any,
		context: ExecutionContext,
	): Promise<NodeExecutionResult> {
		try {
			// Extract document sources from input data
			const sources = this.extractSources(inputData);

			if (!sources || sources.length === 0) {
				return this.error('No document sources found in input data');
			}

			// TODO: This will be implemented in Phase 10 when we integrate with RunsService
			// For now, return a placeholder indicating extraction will be queued
			return this.success({
				status: 'queued',
				extractorId: params.extractorId,
				processingMode: params.processingMode || 'unified',
				sources,
				message:
					'Extraction queued - will be implemented in Phase 10',
			});
		} catch (error) {
			return this.error(`Failed to queue extraction: ${error.message}`);
		}
	}

	private extractSources(inputData: any): any[] {
		// Handle different input formats
		if (!inputData) {
			return [];
		}

		// If input has a sources array (from webhook with file URLs)
		if (Array.isArray(inputData.sources)) {
			return inputData.sources;
		}

		// If input has documents array
		if (Array.isArray(inputData.documents)) {
			return inputData.documents;
		}

		// If input has a single documentUrl
		if (inputData.documentUrl) {
			return [
				{
					type: 'url',
					url: inputData.documentUrl,
					name: inputData.documentName || 'document',
				},
			];
		}

		// If input has fileUrls array (from email trigger)
		if (Array.isArray(inputData.fileUrls)) {
			return inputData.fileUrls.map((url: string, index: number) => ({
				type: 'url',
				url,
				name: inputData.fileNames?.[index] || `file-${index}`,
			}));
		}

		return [];
	}

	validate(params: Record<string, any>): string[] | null {
		const errors = super.validate(params);
		if (errors) return errors;

		const newErrors: string[] = [];

		// Validate extractorId is a UUID
		if (params.extractorId) {
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			if (!uuidRegex.test(params.extractorId)) {
				newErrors.push('Invalid extractor ID format');
			}
		}

		return newErrors.length > 0 ? newErrors : null;
	}
}
