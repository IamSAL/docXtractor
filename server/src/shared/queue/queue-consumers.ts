/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QueueName } from './queue-names';
import { RunsService } from '../../runs/runs.service';

@Processor(QueueName.PARSED_DOCUMENTS)
export class ParsedDocumentsConsumer extends WorkerHost {
  private readonly logger = new Logger(ParsedDocumentsConsumer.name);

  constructor(private readonly runsService: RunsService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`Processing parsed document job: ${job.id}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = job.data;
    // Expected data: { run_id, document_id, status, markdown_content, token_count }
    try {
      await this.runsService.handleDocumentParsed(data);
    } catch (error) {
      this.logger.error(`Error handling parsed document: ${error.message}`);
      throw error;
    }
  }
}

@Processor(QueueName.EXTRACTION_COMPLETED)
export class ExtractionCompletedConsumer extends WorkerHost {
  private readonly logger = new Logger(ExtractionCompletedConsumer.name);

  constructor(private readonly runsService: RunsService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`Processing extraction completed job: ${job.id}`);
    const data = job.data;
    // Expected data: { run_id, status, data, usage }
    try {
      await this.runsService.handleExtractionCompleted(data);
    } catch (error) {
      this.logger.error(
        `Error handling extraction completion: ${error.message}`,
      );
      throw error;
    }
  }
}

// Note: WorkflowExecutionsConsumer is in workflows module to avoid circular dependency
