import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseWorkflowNode } from './BaseWorkflowNode';
import { Filter, Code, Languages, Settings2 } from 'lucide-react';

export const ProcessorNode = memo((props: NodeProps) => {
	const { type } = props.data;

	// Select icon and icon background based on processor type
	let icon = <Settings2 className="w-5 h-5 stroke-[2.5]" />;
	let iconBg = '#E0E7FF'; // Indigo

	if (type === 'filter') {
		icon = <Filter className="w-5 h-5 stroke-[2.5]" />;
		iconBg = '#DBEAFE'; // Sky blue
	} else if (type === 'translate') {
		icon = <Languages className="w-5 h-5 stroke-[2.5]" />;
		iconBg = '#E0F2FE'; // Light cyan
	} else if (type === 'transform') {
		icon = <Code className="w-5 h-5 stroke-[2.5]" />;
		iconBg = '#DDD6FE'; // Violet
	}

	return (
		<BaseWorkflowNode
			{...props}
			headerBgColor="#E3F2FD" // Blue tint
			headerIconBg={iconBg}
			data={{
				...props.data,
				icon,
			}}
		/>
	);
});

ProcessorNode.displayName = 'ProcessorNode';
