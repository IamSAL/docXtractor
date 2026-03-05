/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QueueName } from '../../shared/queue/queue-names';
import { WorkflowExecutorService } from '../executor/workflow-executor.service';

@Processor(QueueName.WORKFLOW_EXECUTIONS, {
  concurrency: 3, // Allow 3 workflows to execute in parallel
})
export class WorkflowExecutionsConsumer extends WorkerHost {
  private readonly logger = new Logger(WorkflowExecutionsConsumer.name);

  constructor(private readonly executorService: WorkflowExecutorService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`Processing workflow execution job: ${job.id}`);
    const { workflowId, triggerPayload } = job.data;

    try {
      const execution = await this.executorService.executeWorkflow(
        workflowId,
        triggerPayload,
      );

      this.logger.log(
        `Workflow execution ${execution.id} completed with status: ${execution.status}`,
      );
      return execution;
    } catch (error) {
      this.logger.error(
        `Workflow execution failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
