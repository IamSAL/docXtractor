import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseWorkflowNode } from './BaseWorkflowNode';
import { Mail, Webhook, Table, ScanLine } from 'lucide-react';

export const ActionNode = memo((props: NodeProps) => {
	const { type } = props.data;

	// Select icon based on action type
	let icon = <Webhook className="w-4 h-4" />;
	if (type === 'send_email') {
		icon = <Mail className="w-4 h-4" />;
	} else if (type === 'extract_data') {
		icon = <ScanLine className="w-4 h-4" />;
	} else if (type === 'google_sheets') {
		icon = <Table className="w-4 h-4" />;
	}

	const bgColor = type === 'extract_data' ? '#fde047' : '#C8E6C9';

	return (
		<BaseWorkflowNode
			{...props}
			headerBgColor={bgColor}
			data={{
				...props.data,
				icon,
			}}
		/>
	);
});

ActionNode.displayName = 'ActionNode';
