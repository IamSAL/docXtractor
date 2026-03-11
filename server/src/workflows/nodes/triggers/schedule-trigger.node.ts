import { TriggerNode } from '../base/trigger-node.base';
import {
  JSONSchema,
  ExecutionContext,
  NodeExecutionResult,
} from '../interfaces/node.interface';

export class ScheduleTriggerNode extends TriggerNode {
  type = 'schedule_trigger';
  displayName = 'Schedule Trigger';
  description = 'Triggers workflow on a cron schedule';
  icon = 'calendar';

  getParameterSchema(): JSONSchema {
    return {
      type: 'object',
      properties: {
        cronExpression: {
          type: 'string',
          title: 'Cron Expression',
          description: 'Cron schedule (e.g., "0 9 * * *" for daily at 9 AM)',
          examples: ['0 9 * * *', '0 9 * * 1-5', '*/15 * * * *', '0 0 * * 0'],
        },
        timezone: {
          type: 'string',
          title: 'Timezone',
          description: 'Timezone for schedule (e.g., America/New_York)',
          default: 'UTC',
        },
      },
      required: ['cronExpression'],
    };
  }

  execute(
    params: Record<string, any>,
    _inputData: any,
    _context: ExecutionContext,
  ): Promise<NodeExecutionResult> {
    // Schedule triggers pass timestamp as output
    return Promise.resolve(
      this.success({
        timestamp: new Date().toISOString(),
        cronExpression: params.cronExpression,
        timezone: params.timezone || 'UTC',
      }),
    );
  }

  validate(params: Record<string, any>): string[] | null {
    const errors = super.validate(params);
    if (errors) return errors;

    const newErrors: string[] = [];

    // Basic cron expression validation (5 parts)
    if (params.cronExpression) {
      const parts = (params.cronExpression as string).trim().split(/\s+/);
      if (parts.length !== 5) {
        newErrors.push(
          'Cron expression must have 5 parts (minute hour day month weekday)',
        );
      }
    }

    return newErrors.length > 0 ? newErrors : null;
  }
}
