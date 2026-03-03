import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName } from './queue-names';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QueueName.UPLOADED_DOCUMENTS)
    private readonly uploadedDocsQueue: Queue,
    @InjectQueue(QueueName.PARSED_DOCUMENTS)
    private readonly parsedDocsQueue: Queue,
    @InjectQueue(QueueName.EXTRACTION_REQUESTS)
    private readonly extractionRequestsQueue: Queue,
    @InjectQueue(QueueName.EXTRACTION_COMPLETED)
    private readonly extractionCompletedQueue: Queue,
  ) {}

  async addJob(
    queueName: QueueName,
    jobName: string,
    data: any,
    opts: any = {},
  ) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    this.logger.log(`Adding job ${jobName} to queue ${queueName}`);
    return await queue.add(jobName, data, {
      removeOnComplete: true,
      removeOnFail: 1000,
      ...opts,
    });
  }

  private getQueue(queueName: QueueName): Queue | null {
    switch (queueName) {
      case QueueName.UPLOADED_DOCUMENTS:
        return this.uploadedDocsQueue;
      case QueueName.PARSED_DOCUMENTS:
        return this.parsedDocsQueue;
      case QueueName.EXTRACTION_REQUESTS:
        return this.extractionRequestsQueue;
      case QueueName.EXTRACTION_COMPLETED:
        return this.extractionCompletedQueue;
      default:
        return null;
    }
  }
}
