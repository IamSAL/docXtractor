import { CheckCircle2, XCircle, Circle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecutionStatusPanelProps {
	execution: {
		id: string;
		status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
		startedAt?: string;
		completedAt?: string;
		errorMessage?: string;
	} | null;
	executionOrder: string[];
	nodeExecutions: Map<
		string,
		{
			nodeId: string;
			status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
			durationMs?: number;
		}
	>;
}

export const ExecutionStatusPanel = ({
	execution,
	executionOrder,
	nodeExecutions,
}: ExecutionStatusPanelProps) => {
	if (!execution) {
		return (
			<div className="fixed bottom-4 right-4 w-80 bg-white border-3 border-black shadow-hard-lg p-4">
				<div className="flex items-center gap-2 mb-2">
					<Circle className="w-4 h-4 text-gray-400" />
					<h3 className="font-display font-bold text-sm uppercase">
						No Active Execution
					</h3>
				</div>
				<p className="text-xs text-gray-600 font-body">
					Click "Test Workflow" to start an execution
				</p>
			</div>
		);
	}

	const getStatusIcon = (
		status: string,
	): { icon: JSX.Element; color: string } => {
		switch (status) {
			case 'pending':
				return {
					icon: <Clock className="w-4 h-4" />,
					color: 'text-gray-500',
				};
			case 'running':
				return {
					icon: <Loader2 className="w-4 h-4 animate-spin" />,
					color: 'text-accent-yellow',
				};
			case 'success':
				return {
					icon: <CheckCircle2 className="w-4 h-4" />,
					color: 'text-accent-cyan',
				};
			case 'failed':
				return {
					icon: <XCircle className="w-4 h-4" />,
					color: 'text-accent-red',
				};
			default:
				return {
					icon: <Circle className="w-4 h-4" />,
					color: 'text-gray-400',
				};
		}
	};

	const executionStatus = getStatusIcon(execution.status);

	return (
		<div className="fixed bottom-4 right-4 w-80 bg-white border-3 border-black shadow-hard-lg">
			{/* Header */}
			<div
				className={cn(
					'flex items-center gap-2 px-4 py-2 border-b-2 border-black',
					execution.status === 'running' && 'bg-accent-yellow/20',
					execution.status === 'success' && 'bg-accent-cyan/20',
					execution.status === 'failed' && 'bg-accent-red/20',
				)}
			>
				<div className={executionStatus.color}>{executionStatus.icon}</div>
				<h3 className="font-display font-bold text-sm uppercase flex-1">
					{execution.status === 'pending' && 'Starting...'}
					{execution.status === 'running' && 'Running'}
					{execution.status === 'success' && 'Completed'}
					{execution.status === 'failed' && 'Failed'}
					{execution.status === 'cancelled' && 'Cancelled'}
				</h3>
			</div>

			{/* Node Execution List */}
			<div className="p-4 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
				{executionOrder.length === 0 ? (
					<p className="text-xs text-gray-600 font-body italic">
						Waiting for nodes to execute...
					</p>
				) : (
					executionOrder.map((nodeId, index) => {
						const nodeExec = nodeExecutions.get(nodeId);
						if (!nodeExec) return null;

						const nodeStatus = getStatusIcon(nodeExec.status);

						return (
							<div
								key={nodeId}
								className="flex items-center gap-2 text-xs font-body"
							>
								<span className="text-gray-400 font-mono w-5">
									{index + 1}.
								</span>
								<div className={nodeStatus.color}>{nodeStatus.icon}</div>
								<span className="flex-1 truncate font-bold">
									{nodeId}
								</span>
								{nodeExec.durationMs && (
									<span className="text-gray-500 text-[10px]">
										{nodeExec.durationMs}ms
									</span>
								)}
							</div>
						);
					})
				)}
			</div>

			{/* Error Message */}
			{execution.errorMessage && (
				<div className="px-4 pb-4">
					<div className="bg-accent-red/10 border-2 border-accent-red px-2 py-1 text-xs font-body text-accent-red">
						{execution.errorMessage}
					</div>
				</div>
			)}
		</div>
	);
};
