import { memo, ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';

interface BaseWorkflowNodeProps {
	id: string;
	data: {
		label: string;
		icon?: ReactNode;
		params?: Record<string, any>;
		status?: 'idle' | 'pending' | 'running' | 'success' | 'failed';
		type?: string;
	};
	selected?: boolean;
	headerBgColor: string;
	headerIconBg?: string;
	children?: ReactNode;
}

export const BaseWorkflowNode = memo(
	({ id, data, selected, headerBgColor, headerIconBg = '#fff', children }: BaseWorkflowNodeProps) => {
		const { label, icon, params, status = 'idle', type } = data;

		const getStatusIcon = () => {
			switch (status) {
				case 'pending':
					return <Clock className="w-4 h-4 text-orange-600" />;
				case 'running':
					return <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />;
				case 'success':
					return <CheckCircle2 className="w-4 h-4 text-green-600" />;
				case 'failed':
					return <XCircle className="w-4 h-4 text-red-600" />;
				default:
					return null;
			}
		};

		const getParamSummary = () => {
			if (!params || Object.keys(params).length === 0) return null;

			// Extract meaningful params for display
			const displayParams = [];

			if (params.extractorId) displayParams.push({ label: 'Extractor', value: 'Configured' });
			if (params.to) displayParams.push({ label: 'To', value: params.to });
			if (params.webhookPath) displayParams.push({ label: 'Path', value: params.webhookPath });
			if (params.cronExpression) displayParams.push({ label: 'Cron', value: params.cronExpression });
			if (params.url) displayParams.push({ label: 'URL', value: params.url });
			if (params.condition) displayParams.push({ label: 'Condition', value: params.condition });

			return displayParams.slice(0, 2); // Show max 2 params
		};

		const paramSummary = getParamSummary();

		return (
			<div
				className={cn(
					'relative w-[280px] border-3 border-black bg-white shadow-hard transition-all duration-200',
					selected && 'border-accent-yellow shadow-[6px_6px_0px_#000]',
					status === 'running' && 'node-running',
					status === 'failed' && 'node-failed',
				)}
				style={{ borderRadius: '2px' }}
			>
				{/* Selected badge */}
				{selected && (
					<div
						className="absolute -top-3 -right-3 bg-accent-yellow border-2 border-black px-2 py-1 font-display text-[9px] font-black shadow-hard-sm z-10"
						style={{ transform: 'rotate(2deg)' }}
					>
						⚡ SELECTED
					</div>
				)}

				{/* Status indicator */}
				{status !== 'idle' && (
					<div className="absolute -top-2 -left-2 bg-white border-2 border-black p-1 shadow-[2px_2px_0px_#000] z-10">
						{getStatusIcon()}
					</div>
				)}

				{/* Header with icon */}
				<div
					className="flex items-center gap-3 px-3 py-2.5 border-b-3 border-black relative"
					style={{ backgroundColor: headerBgColor }}
				>
					{/* Icon badge */}
					{icon && (
						<div
							className="flex items-center justify-center w-9 h-9 border-2 border-black shadow-[2px_2px_0px_#000]"
							style={{ backgroundColor: headerIconBg }}
						>
							{icon}
						</div>
					)}

					{/* Title and type */}
					<div className="flex-1 min-w-0">
						<div className="font-display font-black text-sm uppercase tracking-tight leading-tight truncate">
							{label}
						</div>
						{type && (
							<div className="text-[9px] font-bold text-gray-600 uppercase tracking-wider mt-0.5">
								{type.replace(/_/g, ' ')}
							</div>
						)}
					</div>

					{/* Node ID badge */}
					<div className="text-[8px] font-mono bg-black text-white px-1.5 py-0.5 tracking-tighter">
						#{id.slice(-4)}
					</div>
				</div>

				{/* Body with parameters */}
				<div className="px-3 py-3 min-h-[60px]">
					{children || (
						<>
							{paramSummary && paramSummary.length > 0 ? (
								<div className="space-y-1.5">
									{paramSummary.map((param, idx) => (
										<div key={idx} className="flex items-start gap-2 text-xs">
											<div className="font-bold text-gray-700 uppercase text-[10px] tracking-wide min-w-[60px]">
												{param.label}:
											</div>
											<div className="font-body text-gray-900 truncate flex-1 bg-gray-50 px-2 py-0.5 border border-gray-300">
												{param.value}
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="flex items-center justify-center h-full">
									<div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide border-2 border-dashed border-gray-300 px-3 py-2">
										⚙️ Not Configured
									</div>
								</div>
							)}
						</>
					)}
				</div>

				{/* Footer with stats */}
				<div className="border-t-2 border-black bg-gray-50 px-3 py-1.5 flex items-center justify-between">
					<div className="flex items-center gap-1.5">
						<div className="w-2 h-2 rounded-full bg-green-500 border border-black"></div>
						<span className="text-[9px] font-bold text-gray-600 uppercase">Ready</span>
					</div>
					{status === 'success' && (
						<span className="text-[9px] font-bold text-green-600 uppercase">✓ Completed</span>
					)}
					{status === 'running' && (
						<span className="text-[9px] font-bold text-yellow-600 uppercase animate-pulse">● Processing</span>
					)}
					{status === 'failed' && (
						<span className="text-[9px] font-bold text-red-600 uppercase">✗ Failed</span>
					)}
				</div>

				{/* Input Handle (left) */}
				<Handle
					type="target"
					position={Position.Left}
					className="w-6 h-6 bg-white border-3 border-black rounded-full hover:bg-accent-yellow hover:scale-110 cursor-crosshair transition-all shadow-[2px_2px_0px_#000]"
					style={{ left: '-13px' }}
				/>

				{/* Output Handle (right) */}
				<Handle
					type="source"
					position={Position.Right}
					className="w-6 h-6 bg-white border-3 border-black rounded-full hover:bg-accent-cyan hover:scale-110 cursor-crosshair transition-all shadow-[2px_2px_0px_#000]"
					style={{ right: '-13px' }}
				/>
			</div>
		);
	},
);

BaseWorkflowNode.displayName = 'BaseWorkflowNode';
