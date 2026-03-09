import {
  INode,
  JSONSchema,
  ExecutionContext,
  NodeExecutionResult,
} from '../interfaces/node.interface';
import { NodeCategory } from '../../enums/node-category.enum';

export abstract class BaseNode implements INode {
  abstract type: string;
  abstract category: NodeCategory;
  abstract displayName: string;
  abstract description: string;
  icon?: string;

  abstract getParameterSchema(): JSONSchema;

  abstract execute(
    params: Record<string, any>,
    inputData: any,
    context: ExecutionContext,
  ): Promise<NodeExecutionResult>;

  /**
   * Default validation - check required fields based on schema
   */
  validate(params: Record<string, any>): string[] | null {
    const schema = this.getParameterSchema();
    const errors: string[] = [];

    if (schema.required) {
      for (const field of schema.required) {
        if (params[field] === undefined || params[field] === null) {
          errors.push(`Missing required parameter: ${field}`);
        }
      }
    }

    return errors.length > 0 ? errors : null;
  }

  /**
   * Helper method to create success result
   */
  protected success(outputData?: any): NodeExecutionResult {
    return {
      success: true,
      outputData,
    };
  }

  /**
   * Helper method to create error result
   */
  protected error(message: string): NodeExecutionResult {
    return {
      success: false,
      error: message,
    };
  }
}
