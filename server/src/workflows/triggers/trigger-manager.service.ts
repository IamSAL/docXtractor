// fallow-ignore-file circular-dependencies
/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from '../entities/workflow.entity';
import { WorkflowStatus } from '../enums/workflow-status.enum';
import { WorkflowsService } from '../workflows.service';

@Injectable()
export class TriggerManagerService {
  private readonly logger = new Logger(TriggerManagerService.name);
  private scheduledJobs: Map<string, any> = new Map();

  constructor(
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @Inject(forwardRef(() => WorkflowsService))
    private workflowsService: WorkflowsService,
  ) {}

  /**
   * Register triggers for a workflow when it's activated
   */
  async registerTriggers(workflowId: string) {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId },
    });

    if (!workflow || !workflow.triggerConfig) {
      return;
    }

    this.logger.log(`Registering triggers for workflow ${workflowId}`);

    const { type } = workflow.triggerConfig;

    switch (type) {
      case 'webhook':
        // Webhook triggers are stateless - no registration needed
        this.logger.log(`Webhook trigger ready at /webhooks/${workflowId}/*`);
        break;

      case 'schedule':
        this.registerScheduleTrigger(workflow);
        break;

      case 'email':
        // Email polling will be handled by a global worker
        this.logger.log(`Email trigger registered for workflow ${workflowId}`);
        break;

      default:
        this.logger.warn(`Unknown trigger type: ${type}`);
    }
  }

  /**
   * Unregister triggers when workflow is paused/deleted
   */
  unregisterTriggers(workflowId: string) {
    this.logger.log(`Unregistering triggers for workflow ${workflowId}`);

    // Remove scheduled jobs
    if (this.scheduledJobs.has(workflowId)) {
      const job = this.scheduledJobs.get(workflowId);
      if (job) {
        clearInterval(job);
        this.scheduledJobs.delete(workflowId);
      }
    }
  }

  /**
   * Register a schedule (cron) trigger
   */
  private registerScheduleTrigger(workflow: Workflow) {
    const { cronExpression } = workflow.triggerConfig || {};

    if (!cronExpression) {
      this.logger.warn(`No cron expression for workflow ${workflow.id}`);
      return;
    }

    // For MVP, use simple interval polling (replace with proper cron in production)
    // Parse cron: "*/5 * * * *" = every 5 minutes
    const intervalMs = this.parseCronToInterval(cronExpression);

    if (intervalMs) {
      const job = setInterval(async () => {
        try {
          // Check if workflow is still active
          const currentWorkflow = await this.workflowRepository.findOne({
            where: { id: workflow.id },
          });

          if (
            currentWorkflow &&
            currentWorkflow.status === WorkflowStatus.ACTIVE
          ) {
            this.logger.log(`Triggering scheduled workflow ${workflow.id}`);
            await this.workflowsService.triggerWorkflow(workflow.id, {
              trigger: 'schedule',
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          this.logger.error(
            `Error triggering scheduled workflow ${workflow.id}: ${error.message}`,
          );
        }
      }, intervalMs);

      this.scheduledJobs.set(workflow.id, job);
      this.logger.log(
        `Scheduled workflow ${workflow.id} with interval ${intervalMs}ms (cron: ${cronExpression})`,
      );
    }
  }

  /**
   * Parse cron expression to interval (basic implementation)
   * TODO: Replace with proper cron parser (e.g., node-cron, cron-parser)
   */
  private parseCronToInterval(cronExpression: string): number | null {
    // Basic parsing for "*/N * * * *" format (every N minutes)
    const match = cronExpression.match(/^\*\/(\d+) \* \* \* \*$/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      return minutes * 60 * 1000;
    }

    // Default: every 5 minutes
    return 5 * 60 * 1000;
  }

  /**
   * Initialize triggers on service startup (re-register active workflows)
   */
  async onModuleInit() {
    this.logger.log('Initializing triggers for active workflows...');

    const activeWorkflows = await this.workflowRepository.find({
      where: { status: WorkflowStatus.ACTIVE },
    });

    for (const workflow of activeWorkflows) {
      await this.registerTriggers(workflow.id);
    }

    this.logger.log(
      `Initialized ${activeWorkflows.length} active workflow triggers`,
    );
  }

  /**
   * Cleanup on service shutdown
   */
  onModuleDestroy() {
    this.logger.log('Cleaning up triggers...');

    for (const [, job] of this.scheduledJobs.entries()) {
      clearInterval(job);
    }

    this.scheduledJobs.clear();
  }
}
