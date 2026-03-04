import { BaseNode } from './base-node';
import { NodeCategory } from '../../enums/node-category.enum';

export abstract class TriggerNode extends BaseNode {
	category = NodeCategory.TRIGGER;

	/**
	 * Trigger nodes don't have upstream input data
	 * They start the workflow execution
	 */
	protected validateTriggerExecution(inputData: any): void {
		if (inputData !== null && inputData !== undefined) {
			throw new Error('Trigger nodes should not receive input data');
		}
	}
}
