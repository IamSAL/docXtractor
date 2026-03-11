import { Injectable } from '@nestjs/common';
import { ProcessorNode } from '../base/processor-node.base';
import {
  JSONSchema,
  ExecutionContext,
  NodeExecutionResult,
} from '../interfaces/node.interface';

@Injectable()
export class FilterNode extends ProcessorNode {
  type = 'filter';
  displayName = 'Filter';
  description = 'Filter data based on conditions';
  icon = 'funnel';

  getParameterSchema(): JSONSchema {
    return {
      type: 'object',
      properties: {
        condition: {
          type: 'string',
          title: 'Condition',
          description: 'Filter condition (e.g., "status === \'success\'")',
          default: 'true',
        },
      },
      required: ['condition'],
    };
  }

  execute(
    params: Record<string, any>,
    inputData: any,
    _context: ExecutionContext,
  ): Promise<NodeExecutionResult> {
    try {
      // Evaluate condition
      const passed = this.evaluateCondition(params.condition, inputData);

      if (passed) {
        // Pass data through if condition is true
        return Promise.resolve(this.success(inputData));
      } else {
        // Return empty/null if condition is false
        return Promise.resolve(this.success(null));
      }
    } catch (error) {
      return Promise.resolve(
        this.error(`Filter evaluation failed: ${error.message}`),
      );
    }
  }

  private evaluateCondition(condition: string, data: any): boolean {
    try {
      // Simple condition evaluation
      // For MVP, support basic comparisons
      // TODO: In future, integrate with JSONata or similar expression language

      // Handle simple boolean conditions
      if (condition === 'true') return true;
      if (condition === 'false') return false;

      // Handle property checks (e.g., "status === 'success'")
      // This is a simplified implementation - in production, use a proper expression parser
      if (condition.includes('===')) {
        const [left, right] = condition.split('===').map((s) => s.trim());
        const leftValue = this.resolveValue(left, data);
        const rightValue = this.resolveValue(right, data);
        return leftValue === rightValue;
      }

      if (condition.includes('!==')) {
        const [left, right] = condition.split('!==').map((s) => s.trim());
        const leftValue = this.resolveValue(left, data);
        const rightValue = this.resolveValue(right, data);
        return leftValue !== rightValue;
      }

      // Default to true if we can't parse
      return true;
    } catch {
      return false;
    }
  }

  private resolveValue(expression: string, data: any): any {
    // Remove quotes if present
    if (
      (expression.startsWith('"') && expression.endsWith('"')) ||
      (expression.startsWith("'") && expression.endsWith("'"))
    ) {
      return expression.slice(1, -1);
    }

    // Try to resolve as property path (e.g., "data.status")
    if (expression.includes('.')) {
      const parts = expression.split('.');
      let value = data;
      for (const part of parts) {
        value = value?.[part];
      }
      return value;
    }

    // Try to resolve as direct property
    return data?.[expression] ?? expression;
  }
}
