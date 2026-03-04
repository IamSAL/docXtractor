import { Bell, Calendar, Webhook, Filter, Mail, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NodeType {
	type: string;
	category: string;
	displayName: string;
	description: string;
	icon: React.ReactNode;
}

const nodeTypes: NodeType[] = [
	{
		type: 'webhook_trigger',
		category: 'trigger',
		displayName: 'Webhook',
		description: 'Trigger from HTTP POST',
		icon: <Webhook className="w-5 h-5" />,
	},
	{
		type: 'schedule_trigger',
		category: 'trigger',
		displayName: 'Schedule',
		description: 'Trigger on cron schedule',
		icon: <Calendar className="w-5 h-5" />,
	},
	{
		type: 'filter',
		category: 'processor',
		displayName: 'Filter',
		description: 'Filter data by condition',
		icon: <Filter className="w-5 h-5" />,
	},
	{
		type: 'extract_data',
		category: 'action',
		displayName: 'Extract Data',
		description: 'AI-powered data extraction',
		icon: <ScanLine className="w-5 h-5" />,
	},
	{
		type: 'send_email',
		category: 'action',
		displayName: 'Send Email',
		description: 'Send email with results',
		icon: <Mail className="w-5 h-5" />,
	},
];

const categoryColors = {
	trigger: '#E0F7FA',
	processor: '#E3F2FD',
	action: '#C8E6C9',
};

interface NodePaletteProps {
	onNodeDragStart: (type: string, category: string, label: string) => void;
}

export function NodePalette({ onNodeDragStart }: NodePaletteProps) {
	const groupedNodes = {
		trigger: nodeTypes.filter((n) => n.category === 'trigger'),
		processor: nodeTypes.filter((n) => n.category === 'processor'),
		action: nodeTypes.filter((n) => n.category === 'action'),
	};

	return (
		<div className="w-72 h-full bg-white border-r-3 border-black overflow-y-auto">
			<div className="p-4 border-b-3 border-black">
				<h2 className="font-display font-bold text-lg uppercase tracking-wide">
					Node Palette
				</h2>
			</div>

			<div className="p-4 space-y-6">
				{/* Triggers */}
				<div>
					<h3 className="font-display font-bold text-sm uppercase tracking-wide mb-3 text-purple-600">
						Triggers
					</h3>
					<div className="space-y-3">
						{groupedNodes.trigger.map((node) => (
							<div
								key={node.type}
								draggable
								onDragStart={() =>
									onNodeDragStart(node.type, node.category, node.displayName)
								}
								className={cn(
									'border-2 border-black shadow-hard-sm bg-white p-3 cursor-grab active:cursor-grabbing',
									'transition-all duration-200 hover:-translate-y-1 hover:shadow-hard',
									'active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
								)}
								style={{
									borderRadius: '0.125rem',
								}}
							>
								<div className="flex items-start gap-2">
									<div
										className="p-2 border-2 border-black"
										style={{
											backgroundColor: categoryColors[node.category],
											borderRadius: '0.125rem',
										}}
									>
										{node.icon}
									</div>
									<div className="flex-1 min-w-0">
										<div className="font-display font-bold text-sm">
											{node.displayName}
										</div>
										<div className="text-xs text-gray-600 font-body mt-0.5">
											{node.description}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Processors */}
				<div>
					<h3 className="font-display font-bold text-sm uppercase tracking-wide mb-3 text-blue-600">
						Processors
					</h3>
					<div className="space-y-3">
						{groupedNodes.processor.map((node) => (
							<div
								key={node.type}
								draggable
								onDragStart={() =>
									onNodeDragStart(node.type, node.category, node.displayName)
								}
								className={cn(
									'border-2 border-black shadow-hard-sm bg-white p-3 cursor-grab active:cursor-grabbing',
									'transition-all duration-200 hover:-translate-y-1 hover:shadow-hard',
									'active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
								)}
								style={{
									borderRadius: '0.125rem',
								}}
							>
								<div className="flex items-start gap-2">
									<div
										className="p-2 border-2 border-black"
										style={{
											backgroundColor: categoryColors[node.category],
											borderRadius: '0.125rem',
										}}
									>
										{node.icon}
									</div>
									<div className="flex-1 min-w-0">
										<div className="font-display font-bold text-sm">
											{node.displayName}
										</div>
										<div className="text-xs text-gray-600 font-body mt-0.5">
											{node.description}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Actions */}
				<div>
					<h3 className="font-display font-bold text-sm uppercase tracking-wide mb-3 text-green-600">
						Actions
					</h3>
					<div className="space-y-3">
						{groupedNodes.action.map((node) => (
							<div
								key={node.type}
								draggable
								onDragStart={() =>
									onNodeDragStart(node.type, node.category, node.displayName)
								}
								className={cn(
									'border-2 border-black shadow-hard-sm bg-white p-3 cursor-grab active:cursor-grabbing',
									'transition-all duration-200 hover:-translate-y-1 hover:shadow-hard',
									'active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
								)}
								style={{
									borderRadius: '0.125rem',
								}}
							>
								<div className="flex items-start gap-2">
									<div
										className="p-2 border-2 border-black"
										style={{
											backgroundColor:
												node.type === 'extract_data'
													? '#fde047'
													: categoryColors[node.category],
											borderRadius: '0.125rem',
										}}
									>
										{node.icon}
									</div>
									<div className="flex-1 min-w-0">
										<div className="font-display font-bold text-sm">
											{node.displayName}
										</div>
										<div className="text-xs text-gray-600 font-body mt-0.5">
											{node.description}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
