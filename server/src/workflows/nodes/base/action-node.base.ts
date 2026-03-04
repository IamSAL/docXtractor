import { BaseNode } from './base-node';
import { NodeCategory } from '../../enums/node-category.enum';

export abstract class ActionNode extends BaseNode {
	category = NodeCategory.ACTION;

	/**
	 * Action nodes perform operations like sending emails, making HTTP requests, etc.
	 * They typically consume input data and produce minimal output
	 */
}
