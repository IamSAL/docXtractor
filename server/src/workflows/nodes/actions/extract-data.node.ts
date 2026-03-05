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
  description = 'Extract structured data from documents using AI extraction';
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

      const {
        extractorId,
        processingMode = 'unified',
        waitForCompletion = true,
      } = params;

      // Create a Run entity linked to this workflow execution
      const runData = {
        extractorId,
        processingMode,
        sources: sources.map((source: any) => ({
          type: source.type || 'url',
          location: source.url || source.location,
          name: source.name,
          parseStatus: 'pending',
        })),
        workflowExecutionId: context.executionId,
      };

      // Create the run via RunsService
      const run = await context.runsService.create(runData, context.userId);

      // Queue documents for parsing
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        await context.queueService.addJob(
          'uploaded-documents' as any, // QueueName enum
          'parse-document',
          {
            runId: run.id,
            sourceIndex: i,
            url: source.url || source.location,
            fileName: source.name,
          },
        );
      }

      // If waitForCompletion is true, poll for completion (with timeout)
      if (waitForCompletion) {
        const result = await this.waitForRunCompletion(run.id, context, 300000); // 5 min timeout
        return this.success({
          runId: run.id,
          status: result.status,
          extractionResult: result.extractionResult,
          sources: result.sources,
        });
      }

      // Return immediately with runId
      return this.success({
        runId: run.id,
        status: 'queued',
        message: 'Extraction started, continuing workflow without waiting',
      });
    } catch (error) {
      return this.error(`Failed to start extraction: ${error.message}`);
    }
  }

  /**
   * Poll for run completion (used when waitForCompletion=true)
   */
  private async waitForRunCompletion(
    runId: string,
    context: ExecutionContext,
    timeoutMs: number,
  ): Promise<any> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < timeoutMs) {
      const run = await context.runsService.findOne(runId, context.userId);

      if (run.status === 'done' || run.status === 'failed') {
        return run;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error('Extraction timeout - exceeded 5 minutes');
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
