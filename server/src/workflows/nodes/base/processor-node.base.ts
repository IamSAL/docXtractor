import { BaseNode } from './base-node';
import { NodeCategory } from '../../enums/node-category.enum';

export abstract class ProcessorNode extends BaseNode {
	category = NodeCategory.PROCESSOR;

	/**
	 * Processor nodes transform data - they receive input and produce modified output
	 * Examples: filter, transform, translate
	 */
}
