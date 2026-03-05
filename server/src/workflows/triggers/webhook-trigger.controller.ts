import { Controller, Post, Param, Body, Logger } from '@nestjs/common';
import { WorkflowsService } from '../workflows.service';
import { Public } from '../../auth/decorators/public.decorators';

@Controller('webhooks')
export class WebhookTriggerController {
  private readonly logger = new Logger(WebhookTriggerController.name);

  constructor(private workflowsService: WorkflowsService) {}

  /**
   * Generic webhook endpoint for triggering workflows
   * POST /webhooks/:workflowId/*
   */
  @Public()
  @Post(':workflowId/:path(*)')
  async handleWebhook(
    @Param('workflowId') workflowId: string,
    @Param('path') path: string,
    @Body() body: any,
  ) {
    this.logger.log(
      `Webhook received for workflow ${workflowId} at path /${path}`,
    );

    try {
      await this.workflowsService.triggerWorkflow(workflowId, {
        trigger: 'webhook',
        path: `/${path}`,
        body,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Workflow execution queued',
      };
    } catch (error) {
      this.logger.error(`Webhook trigger failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
