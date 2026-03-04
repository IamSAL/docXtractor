import { ArrowLeft, Save, FlaskConical, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowToolbarProps {
	workflowName: string;
	workflowStatus: 'draft' | 'active' | 'paused';
	onBack: () => void;
	onSave: () => void;
	onTest: () => void;
	onActivate: () => void;
	onPause: () => void;
	isSaving?: boolean;
}

export function WorkflowToolbar({
	workflowName,
	workflowStatus,
	onBack,
	onSave,
	onTest,
	onActivate,
	onPause,
	isSaving = false,
}: WorkflowToolbarProps) {
	return (
		<div className="h-16 bg-white border-b-3 border-black px-6 flex items-center justify-between">
			{/* Left: Back button + Workflow name */}
			<div className="flex items-center gap-4">
				<button
					onClick={onBack}
					className="btn-brutalist px-4 py-2 bg-white flex items-center gap-2"
				>
					<ArrowLeft className="w-4 h-4" />
					<span className="font-display font-bold text-sm">Back</span>
				</button>

				<div>
					<h1 className="font-display font-bold text-xl">{workflowName}</h1>
					<div className="flex items-center gap-2 mt-0.5">
						<span className="text-xs text-gray-500 font-body">
							Workflow Builder
						</span>
						<span
							className={cn(
								'status-badge text-[10px]',
								workflowStatus === 'active' && 'status-success',
								workflowStatus === 'paused' && 'status-paused',
								workflowStatus === 'draft' && 'bg-accent-yellow text-black',
							)}
						>
							{workflowStatus.toUpperCase()}
						</span>
					</div>
				</div>
			</div>

			{/* Right: Action buttons */}
			<div className="flex items-center gap-3">
				<button
					onClick={onSave}
					disabled={isSaving}
					className="btn-brutalist px-4 py-2 bg-accent-yellow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<Save className="w-4 h-4" />
					<span className="font-display font-bold text-sm">
						{isSaving ? 'Saving...' : 'Save'}
					</span>
				</button>

				<button
					onClick={onTest}
					className="btn-brutalist px-4 py-2 bg-white flex items-center gap-2"
				>
					<FlaskConical className="w-4 h-4" />
					<span className="font-display font-bold text-sm">Test</span>
				</button>

				{workflowStatus === 'active' ? (
					<button
						onClick={onPause}
						className="btn-brutalist px-4 py-2 bg-gray-200 flex items-center gap-2"
					>
						<Pause className="w-4 h-4" />
						<span className="font-display font-bold text-sm">Pause</span>
					</button>
				) : (
					<button
						onClick={onActivate}
						className="btn-brutalist px-4 py-2 bg-accent-cyan flex items-center gap-2"
					>
						<Play className="w-4 h-4" />
						<span className="font-display font-bold text-sm">Activate</span>
					</button>
				)}
			</div>
		</div>
	);
}
