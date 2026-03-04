import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseWorkflowNode } from './BaseWorkflowNode';
import { Filter, Code, Languages } from 'lucide-react';

export const ProcessorNode = memo((props: NodeProps) => {
	const { type } = props.data;

	// Select icon based on processor type
	let icon = <Code className="w-4 h-4" />;
	if (type === 'filter') {
		icon = <Filter className="w-4 h-4" />;
	} else if (type === 'translate') {
		icon = <Languages className="w-4 h-4" />;
	}

	return (
		<BaseWorkflowNode
			{...props}
			headerBgColor="#E3F2FD" // Blue tint
			data={{
				...props.data,
				icon,
			}}
		/>
	);
});

ProcessorNode.displayName = 'ProcessorNode';
