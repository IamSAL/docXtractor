import { memo, ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface BaseWorkflowNodeProps {
	id: string;
	data: {
		label: string;
		icon?: ReactNode;
		params?: Record<string, any>;
		status?: 'idle' | 'running' | 'success' | 'failed';
	};
	selected?: boolean;
	headerBgColor: string;
	children?: ReactNode;
}

export const BaseWorkflowNode = memo(
	({ id, data, selected, headerBgColor, children }: BaseWorkflowNodeProps) => {
		const { label, icon, params, status = 'idle' } = data;

		return (
			<div
				className={cn(
					'relative min-w-[240px] border-3 border-black bg-white shadow-hard transition-all duration-200',
					selected && 'border-accent-yellow',
					status === 'running' && 'node-running',
					status === 'failed' && 'node-failed',
				)}
				style={{ borderRadius: '0.125rem' }}
			>
				{/* Selected badge */}
				{selected && (
					<div
						className="absolute -top-3 -right-3 bg-accent-yellow border-2 border-black px-2 py-1 font-display text-[10px] font-bold shadow-hard-sm"
						style={{ transform: 'rotate(2deg)' }}
					>
						SELECTED
					</div>
				)}

				{/* Status indicator dot */}
				{status !== 'idle' && (
					<div
						className={cn(
							'absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-black',
							status === 'running' && 'bg-accent-yellow animate-pulse',
							status === 'success' && 'bg-accent-cyan',
							status === 'failed' && 'bg-accent-red',
						)}
					/>
				)}

				{/* Header */}
				<div
					className="flex items-center gap-2 px-3 py-2 border-b-2 border-black"
					style={{ backgroundColor: headerBgColor }}
				>
					{icon && <div className="text-lg">{icon}</div>}
					<span className="font-display font-bold text-sm uppercase flex-1">
						{label}
					</span>
				</div>

				{/* Body */}
				<div className="px-3 py-2 space-y-1">
					{children || (
						<div className="text-xs text-gray-600 font-body">
							{params && Object.keys(params).length > 0 ? (
								Object.entries(params).map(([key, value]) => (
									<div key={key} className="truncate">
										<span className="font-bold">{key}:</span>{' '}
										{String(value)}
									</div>
								))
							) : (
								<span className="italic">Not configured</span>
							)}
						</div>
					)}
				</div>

				{/* Input Handle (left) */}
				<Handle
					type="target"
					position={Position.Left}
					className="w-5 h-5 bg-white border-2 border-black rounded-full hover:border-accent-yellow cursor-crosshair"
				/>

				{/* Output Handle (right) */}
				<Handle
					type="source"
					position={Position.Right}
					className="w-5 h-5 bg-white border-2 border-black rounded-full hover:border-accent-yellow cursor-crosshair"
				/>
			</div>
		);
	},
);

BaseWorkflowNode.displayName = 'BaseWorkflowNode';
