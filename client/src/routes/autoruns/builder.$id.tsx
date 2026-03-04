import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useRef } from 'react';
import {
	Node,
	Edge,
	useNodesState,
	useEdgesState,
	Connection,
	addEdge,
	ReactFlowProvider,
} from '@xyflow/react';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { NodePalette } from '@/components/workflow/NodePalette';
import { NodeConfigPanel } from '@/components/workflow/NodeConfigPanel';
import { WorkflowToolbar } from '@/components/workflow/WorkflowToolbar';
import { TriggerNode, ProcessorNode, ActionNode } from '@/components/workflow/nodes';

export const Route = createFileRoute('/autoruns/builder/$id')({
	component: WorkflowBuilder,
});

const nodeTypes = {
	trigger: TriggerNode,
	processor: ProcessorNode,
	action: ActionNode,
};

function WorkflowBuilder() {
	const { id } = Route.useParams();
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const [selectedNode, setSelectedNode] = useState<Node | null>(null);
	const [workflowName, setWorkflowName] = useState('New Workflow');
	const [workflowStatus, setWorkflowStatus] = useState<'draft' | 'active' | 'paused'>('draft');
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const dragDataRef = useRef<{ type: string; category: string; label: string } | null>(null);

	// Handle connecting nodes
	const onConnect = useCallback(
		(connection: Connection) => {
			setEdges((eds) => addEdge(connection, eds));
		},
		[setEdges],
	);

	// Handle node selection
	const onNodeClick = useCallback(
		(event: React.MouseEvent, node: Node) => {
			setSelectedNode(node);
		},
		[],
	);

	// Handle dragging from palette
	const onNodeDragStart = useCallback((type: string, category: string, label: string) => {
		dragDataRef.current = { type, category, label };
	}, []);

	const onDragOver = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	}, []);

	const onDrop = useCallback(
		(event: React.DragEvent) => {
			event.preventDefault();

			const dragData = dragDataRef.current;
			if (!dragData || !reactFlowWrapper.current) return;

			const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
			const position = {
				x: event.clientX - reactFlowBounds.left,
				y: event.clientY - reactFlowBounds.top,
			};

			const newNode: Node = {
				id: `${dragData.type}_${Date.now()}`,
				type: dragData.category,
				position,
				data: {
					label: dragData.label,
					type: dragData.type,
					params: {},
				},
			};

			setNodes((nds) => nds.concat(newNode));
			dragDataRef.current = null;
		},
		[setNodes],
	);

	// Handle updating node configuration
	const onUpdateNode = useCallback(
		(nodeId: string, updates: Partial<Node['data']>) => {
			setNodes((nds) =>
				nds.map((node) =>
					node.id === nodeId
						? { ...node, data: { ...node.data, ...updates } }
						: node,
				),
			);

			// Update selected node if it's the one being updated
			if (selectedNode?.id === nodeId) {
				setSelectedNode((prev) =>
					prev ? { ...prev, data: { ...prev.data, ...updates } } : null,
				);
			}
		},
		[setNodes, selectedNode],
	);

	// Toolbar actions
	const handleBack = useCallback(() => {
		window.history.back();
	}, []);

	const handleSave = useCallback(() => {
		console.log('Saving workflow:', { nodes, edges });
		// TODO: Implement save logic with API call
		alert('Save functionality will be implemented in Phase 9');
	}, [nodes, edges]);

	const handleTest = useCallback(() => {
		console.log('Testing workflow:', { nodes, edges });
		// TODO: Implement test logic
		alert('Test functionality will be implemented in Phase 10');
	}, [nodes, edges]);

	const handleActivate = useCallback(() => {
		console.log('Activating workflow');
		setWorkflowStatus('active');
		// TODO: Implement activate logic with API call
	}, []);

	const handlePause = useCallback(() => {
		console.log('Pausing workflow');
		setWorkflowStatus('paused');
		// TODO: Implement pause logic with API call
	}, []);

	return (
		<div className="h-screen flex flex-col bg-cream">
			<WorkflowToolbar
				workflowName={workflowName}
				workflowStatus={workflowStatus}
				onBack={handleBack}
				onSave={handleSave}
				onTest={handleTest}
				onActivate={handleActivate}
				onPause={handlePause}
			/>

			<div className="flex-1 flex overflow-hidden">
				{/* Left: Node Palette */}
				<NodePalette onNodeDragStart={onNodeDragStart} />

				{/* Center: Workflow Canvas */}
				<div
					ref={reactFlowWrapper}
					className="flex-1"
					onDrop={onDrop}
					onDragOver={onDragOver}
				>
					<ReactFlowProvider>
						<WorkflowCanvas
							nodes={nodes}
							edges={edges}
							onNodesChange={onNodesChange}
							onEdgesChange={onEdgesChange}
							onConnect={onConnect}
							onNodeClick={onNodeClick}
						/>
					</ReactFlowProvider>
				</div>

				{/* Right: Node Configuration Panel */}
				<NodeConfigPanel
					selectedNode={selectedNode}
					onClose={() => setSelectedNode(null)}
					onUpdateNode={onUpdateNode}
				/>
			</div>
		</div>
	);
}
