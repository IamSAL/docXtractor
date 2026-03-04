import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseWorkflowNode } from './BaseWorkflowNode';
import { Bell, Calendar, Webhook } from 'lucide-react';

export const TriggerNode = memo((props: NodeProps) => {
	const { type } = props.data;

	// Select icon based on trigger type
	let icon = <Bell className="w-4 h-4" />;
	if (type === 'webhook_trigger') {
		icon = <Webhook className="w-4 h-4" />;
	} else if (type === 'schedule_trigger') {
		icon = <Calendar className="w-4 h-4" />;
	}

	return (
		<BaseWorkflowNode
			{...props}
			headerBgColor="#E0F7FA" // Purple tint
			data={{
				...props.data,
				icon,
			}}
		/>
	);
});

TriggerNode.displayName = 'TriggerNode';
