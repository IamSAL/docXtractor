import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseWorkflowNode } from './BaseWorkflowNode';
import { Bell, Calendar, Webhook, Mail, Zap } from 'lucide-react';

export const TriggerNode = memo((props: NodeProps) => {
	const { type } = props.data;

	// Select icon and icon background based on trigger type
	let icon = <Zap className="w-5 h-5 stroke-[2.5]" />;
	let iconBg = '#FDE047'; // Yellow

	if (type === 'webhook_trigger') {
		icon = <Webhook className="w-5 h-5 stroke-[2.5]" />;
		iconBg = '#A7F3D0'; // Green
	} else if (type === 'schedule_trigger') {
		icon = <Calendar className="w-5 h-5 stroke-[2.5]" />;
		iconBg = '#BFDBFE'; // Blue
	} else if (type === 'email_trigger') {
		icon = <Mail className="w-5 h-5 stroke-[2.5]" />;
		iconBg = '#FED7AA'; // Orange
	}

	return (
		<BaseWorkflowNode
			{...props}
			headerBgColor="#E0F7FA" // Cyan tint
			headerIconBg={iconBg}
			data={{
				...props.data,
				icon,
			}}
		/>
	);
});

TriggerNode.displayName = 'TriggerNode';
