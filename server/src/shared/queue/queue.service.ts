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
    @InjectQueue(QueueName.WORKFLOW_EXECUTIONS)
    private readonly workflowExecutionsQueue: Queue,
    @InjectQueue(QueueName.EXAMPLE_SOURCE_PARSE_REQUESTS)
    private readonly exampleSourceParseRequestsQueue: Queue,
    @InjectQueue(QueueName.EXAMPLE_SOURCE_PARSE_COMPLETED)
    private readonly exampleSourceParseCompletedQueue: Queue,
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

  async addBulk(
    queueName: QueueName,
    jobs: { name: string; data: any; opts?: any }[],
  ) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    this.logger.log(`Adding ${jobs.length} jobs in bulk to queue ${queueName}`);
    return await queue.addBulk(
      jobs.map((j) => ({
        name: j.name,
        data: j.data,
        opts: {
          removeOnComplete: true,
          removeOnFail: 1000,
          ...j.opts,
        },
      })),
    );
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
      case QueueName.WORKFLOW_EXECUTIONS:
        return this.workflowExecutionsQueue;
      case QueueName.EXAMPLE_SOURCE_PARSE_REQUESTS:
        return this.exampleSourceParseRequestsQueue;
      case QueueName.EXAMPLE_SOURCE_PARSE_COMPLETED:
        return this.exampleSourceParseCompletedQueue;
      default:
        return null;
    }
  }

  /**
   * Remove all waiting jobs in a queue that belong to a specific run.
   * Active (in-progress) jobs can't be removed, but we mark the run
   * as cancelled in Redis so workers can skip them.
   */
  async removeJobsForRun(queueName: QueueName, runId: string) {
    const queue = this.getQueue(queueName);
    if (!queue) return;

    const waiting = await queue.getJobs(['waiting', 'delayed', 'prioritized']);
    let removed = 0;
    for (const job of waiting) {
      if (job.data?.run_id === runId) {
        try {
          await job.remove();
          removed++;
        } catch {
          // job may have started processing between getJobs and remove — ignore
        }
      }
    }
    if (removed > 0) {
      this.logger.log(
        `Removed ${removed} waiting jobs for run ${runId} from ${queueName}`,
      );
    }

    // Mark run as cancelled in Redis so active workers can check and skip
    const redis = await queue.client;
    if (redis) {
      // Short TTL — just long enough for in-flight jobs to finish
      await redis.set(`run:cancelled:${runId}`, '1', 'EX', 600);
    }
  }

  /**
   * Clear the cancellation mark for a run (e.g. when retrying).
   * Workers check this key — removing it allows new jobs to proceed.
   */
  async clearRunCancellation(runId: string) {
    const queue = this.getQueue(QueueName.UPLOADED_DOCUMENTS);
    if (!queue) return;
    const redis = await queue.client;
    if (redis) {
      await redis.del(`run:cancelled:${runId}`);
    }
  }

  /**
   * Queue a workflow execution
   */
  async queueWorkflowExecution(workflowId: string, triggerPayload: any = {}) {
    this.logger.log(`Queueing workflow execution for workflow ${workflowId}`);
    return await this.addJob(
      QueueName.WORKFLOW_EXECUTIONS,
      'execute-workflow',
      { workflowId, triggerPayload },
      {
        attempts: 2, // Retry once if fails
        backoff: {
          type: 'exponential',
          delay: 2000, // 2s, then 4s
        },
      },
    );
  }
}
