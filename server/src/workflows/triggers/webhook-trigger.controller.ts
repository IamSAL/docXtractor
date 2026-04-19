import {
  Controller,
  Post,
  Param,
  Body,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { WorkflowsService } from '../workflows.service';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { JWTPayload } from '../../shared/types/jwt-payload.types';

@Controller('webhooks')
export class WebhookTriggerController {
  private readonly logger = new Logger(WebhookTriggerController.name);

  constructor(private workflowsService: WorkflowsService) {}

  /**
   * Trigger a workflow via webhook. Caller must be authenticated and own the workflow.
   * POST /webhooks/:workflowId/*
   */
  @Post(':workflowId/*path')
  async handleWebhook(
    @Param('workflowId') workflowId: string,
    @Param('path') path: string,
    @Body() body: unknown,
    @GetUser() user: JWTPayload,
  ) {
    this.logger.log(
      `Webhook received for workflow ${workflowId} at path /${path} by user ${user.sub}`,
    );

    const workflow = await this.workflowsService.findById(workflowId);
    if (workflow.userId !== user.sub) {
      throw new ForbiddenException('You do not own this workflow');
    }

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
