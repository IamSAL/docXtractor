import { Node } from '@xyflow/react';
import { X } from 'lucide-react';

interface NodeConfigPanelProps {
	selectedNode: Node | null;
	onClose: () => void;
	onUpdateNode: (nodeId: string, updates: Partial<Node['data']>) => void;
}

export function NodeConfigPanel({
	selectedNode,
	onClose,
	onUpdateNode,
}: NodeConfigPanelProps) {
	if (!selectedNode) {
		return (
			<div className="w-80 h-full bg-white border-l-3 border-black flex items-center justify-center p-8">
				<div className="text-center text-gray-400">
					<p className="font-display font-bold uppercase text-sm mb-2">
						No Node Selected
					</p>
					<p className="text-xs font-body">
						Click on a node to configure its parameters
					</p>
				</div>
			</div>
		);
	}

	const { data, type } = selectedNode;

	return (
		<div className="w-80 h-full bg-white border-l-3 border-black overflow-y-auto">
			{/* Header */}
			<div className="p-4 border-b-3 border-black flex items-center justify-between sticky top-0 bg-white z-10">
				<h2 className="font-display font-bold text-sm uppercase tracking-wide">
					Node Configuration
				</h2>
				<button
					onClick={onClose}
					className="p-1 hover:bg-gray-100 border-2 border-black transition-colors"
					style={{ borderRadius: '0.125rem' }}
				>
					<X className="w-4 h-4" />
				</button>
			</div>

			{/* Content */}
			<div className="p-4 space-y-4">
				{/* Node Name */}
				<div>
					<label className="block font-display font-bold text-xs uppercase tracking-wider text-gray-600 mb-2">
						Node Name
					</label>
					<input
						type="text"
						value={data.label || ''}
						onChange={(e) =>
							onUpdateNode(selectedNode.id, { label: e.target.value })
						}
						className="w-full border-2 border-black px-4 py-3 font-body font-medium focus:border-accent-yellow focus:outline-none focus:shadow-[2px_2px_0px_0px_#fde047] transition-all"
						style={{ borderRadius: '0.125rem' }}
					/>
				</div>

				{/* Node Type (Read-only) */}
				<div>
					<label className="block font-display font-bold text-xs uppercase tracking-wider text-gray-600 mb-2">
						Node Type
					</label>
					<div className="border-2 border-gray-300 px-4 py-3 bg-gray-50 font-mono text-sm">
						{data.type || type}
					</div>
				</div>

				{/* Node-specific parameters */}
				{renderNodeSpecificFields(selectedNode, onUpdateNode)}

				{/* Params JSON (for debugging) */}
				<div>
					<label className="block font-display font-bold text-xs uppercase tracking-wider text-gray-600 mb-2">
						Parameters (Debug)
					</label>
					<pre className="border-2 border-black bg-gray-900 text-cyan-400 px-4 py-3 text-xs overflow-auto max-h-64 custom-scrollbar font-mono">
						{JSON.stringify(data.params || {}, null, 2)}
					</pre>
				</div>
			</div>
		</div>
	);
}

function renderNodeSpecificFields(
	node: Node,
	onUpdateNode: (nodeId: string, updates: Partial<Node['data']>) => void,
) {
	const { data } = node;
	const params = data.params || {};

	switch (data.type) {
		case 'webhook_trigger':
			return (
				<div>
					<label className="block font-display font-bold text-xs uppercase tracking-wider text-gray-600 mb-2">
						Webhook Path
					</label>
					<input
						type="text"
						placeholder="/invoice-received"
						value={params.webhookPath || ''}
						onChange={(e) =>
							onUpdateNode(node.id, {
								params: { ...params, webhookPath: e.target.value },
							})
						}
						className="w-full border-2 border-black px-4 py-3 font-body font-medium focus:border-accent-yellow focus:outline-none focus:shadow-[2px_2px_0px_0px_#fde047]"
						style={{ borderRadius: '0.125rem' }}
					/>
					<p className="text-xs text-gray-500 mt-1 font-body">
						Must start with / and contain only lowercase letters, numbers, and
						hyphens
					</p>
				</div>
			);

		case 'schedule_trigger':
			return (
				<>
					<div>
						<label className="block font-display font-bold text-xs uppercase tracking-wider text-gray-600 mb-2">
							Cron Expression
						</label>
						<input
							type="text"
							placeholder="0 9 * * *"
							value={params.cronExpression || ''}
							onChange={(e) =>
								onUpdateNode(node.id, {
									params: { ...params, cronExpression: e.target.value },
								})
							}
							className="w-full border-2 border-black px-4 py-3 font-mono text-sm focus:border-accent-yellow focus:outline-none focus:shadow-[2px_2px_0px_0px_#fde047]"
							style={{ borderRadius: '0.125rem' }}
						/>
						<p className="text-xs text-gray-500 mt-1 font-body">
							Examples: "0 9 * * *" (daily 9am), "*/15 * * * *" (every 15min)
						</p>
					</div>
					<div>
						<label className="block font-display font-bold text-xs uppercase tracking-wider text-gray-600 mb-2">
							Timezone
						</label>
						<input
							type="text"
							placeholder="UTC"
							value={params.timezone || 'UTC'}
							onChange={(e) =>
								onUpdateNode(node.id, {
									params: { ...params, timezone: e.target.value },
								})
							}
							className="w-full border-2 border-black px-4 py-3 font-body font-medium focus:border-accent-yellow focus:outline-none focus:shadow-[2px_2px_0px_0px_#fde047]"
							style={{ borderRadius: '0.125rem' }}
						/>
					</div>
				</>
			);

		case 'filter':
			return (
				<div>
					<label className="block font-display font-bold text-xs uppercase tracking-wider text-gray-600 mb-2">
						Condition
					</label>
					<input
						type="text"
						placeholder="status === 'success'"
						value={params.condition || 'true'}
						onChange={(e) =>
							onUpdateNode(node.id, {
								params: { ...params, condition: e.target.value },
							})
						}
						className="w-full border-2 border-black px-4 py-3 font-mono text-sm focus:border-accent-yellow focus:outline-none focus:shadow-[2px_2px_0px_0px_#fde047]"
						style={{ borderRadius: '0.125rem' }}
					/>
					<p className="text-xs text-gray-500 mt-1 font-body">
						Simple comparisons: ===, !==
					</p>
				</div>
			);

		case 'extract_data':
			return (
				<>
					<div>
						<label className="block font-display font-bold text-xs uppercase tracking-wider text-gray-600 mb-2">
							Extractor ID
						</label>
						<input
							type="text"
							placeholder="uuid-here"
							value={params.extractorId || ''}
							onChange={(e) =>
								onUpdateNode(node.id, {
									params: { ...params, extractorId: e.target.value },
								})
							}
							className="w-full border-2 border-black px-4 py-3 font-mono text-sm focus:border-accent-yellow focus:outline-none focus:shadow-[2px_2px_0px_0px_#fde047]"
							style={{ borderRadius: '0.125rem' }}
						/>
					</div>
					<div>
						<label className="block font-display font-bold text-xs uppercase tracking-wider text-gray-600 mb-2">
							Processing Mode
						</label>
						<select
							value={params.processingMode || 'unified'}
							onChange={(e) =>
								onUpdateNode(node.id, {
									params: { ...params, processingMode: e.target.value },
								})
							}
							className="w-full border-2 border-black px-4 py-3 font-body font-medium bg-white focus:border-accent-yellow focus:outline-none focus:shadow-[2px_2px_0px_0px_#fde047]"
							style={{ borderRadius: '0.125rem' }}
						>
							<option value="unified">Unified</option>
							<option value="per_document">Per Document</option>
						</select>
					</div>
				</>
			);

		case 'send_email':
			return (
				<>
					<div>
						<label className="block font-display font-bold text-xs uppercase tracking-wider text-gray-600 mb-2">
							To
						</label>
						<input
							type="email"
							placeholder="user@example.com"
							value={params.to || ''}
							onChange={(e) =>
								onUpdateNode(node.id, {
									params: { ...params, to: e.target.value },
								})
							}
							className="w-full border-2 border-black px-4 py-3 font-body font-medium focus:border-accent-yellow focus:outline-none focus:shadow-[2px_2px_0px_0px_#fde047]"
							style={{ borderRadius: '0.125rem' }}
						/>
					</div>
					<div>
						<label className="block font-display font-bold text-xs uppercase tracking-wider text-gray-600 mb-2">
							Subject
						</label>
						<input
							type="text"
							placeholder="Extraction Results"
							value={params.subject || ''}
							onChange={(e) =>
								onUpdateNode(node.id, {
									params: { ...params, subject: e.target.value },
								})
							}
							className="w-full border-2 border-black px-4 py-3 font-body font-medium focus:border-accent-yellow focus:outline-none focus:shadow-[2px_2px_0px_0px_#fde047]"
							style={{ borderRadius: '0.125rem' }}
						/>
					</div>
					<div>
						<label className="block font-display font-bold text-xs uppercase tracking-wider text-gray-600 mb-2">
							Body
						</label>
						<textarea
							rows={4}
							placeholder="Results: {{results}}"
							value={params.body || ''}
							onChange={(e) =>
								onUpdateNode(node.id, {
									params: { ...params, body: e.target.value },
								})
							}
							className="w-full border-2 border-black px-4 py-3 font-body font-medium focus:border-accent-yellow focus:outline-none focus:shadow-[2px_2px_0px_0px_#fde047] custom-scrollbar"
							style={{ borderRadius: '0.125rem' }}
						/>
						<p className="text-xs text-gray-500 mt-1 font-body">
							Use {`{{results}}`} for extraction results
						</p>
					</div>
				</>
			);

		case 'webhook_action':
			return (
				<div>
					<label className="block font-display font-bold text-xs uppercase tracking-wider text-gray-600 mb-2">
						Webhook URL
					</label>
					<input
						type="url"
						placeholder="https://example.com/webhook"
						value={params.url || ''}
						onChange={(e) =>
							onUpdateNode(node.id, {
								params: { ...params, url: e.target.value },
							})
						}
						className="w-full border-2 border-black px-4 py-3 font-body font-medium focus:border-accent-yellow focus:outline-none focus:shadow-[2px_2px_0px_0px_#fde047]"
						style={{ borderRadius: '0.125rem' }}
					/>
				</div>
			);

		default:
			return null;
	}
}
