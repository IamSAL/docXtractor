import { useCallback, useMemo } from 'react';
import {
	ReactFlow,
	Background,
	Controls,
	MiniMap,
	Node,
	Edge,
	Connection,
	addEdge,
	useNodesState,
	useEdgesState,
	MarkerType,
} from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';

interface WorkflowCanvasProps {
	nodes: Node[];
	edges: Edge[];
	onNodesChange: (changes: any) => void;
	onEdgesChange: (changes: any) => void;
	onConnect: (connection: Connection) => void;
	onNodeClick?: (event: React.MouseEvent, node: Node) => void;
}

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));
	dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 80 });

	nodes.forEach((node) => {
		dagreGraph.setNode(node.id, { width: 240, height: 120 });
	});

	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target);
	});

	dagre.layout(dagreGraph);

	const layoutedNodes = nodes.map((node) => {
		const nodeWithPosition = dagreGraph.node(node.id);
		return {
			...node,
			position: {
				x: nodeWithPosition.x - 120,
				y: nodeWithPosition.y - 60,
			},
		};
	});

	return { nodes: layoutedNodes, edges };
};

const nodeColor = (node: Node) => {
	switch (node.type) {
		case 'trigger':
			return '#E0F7FA'; // Purple tint
		case 'processor':
			return '#E3F2FD'; // Blue tint
		case 'action':
			return '#C8E6C9'; // Green tint
		default:
			return '#fff';
	}
};

export function WorkflowCanvas({
	nodes,
	edges,
	onNodesChange,
	onEdgesChange,
	onConnect,
	onNodeClick,
}: WorkflowCanvasProps) {
	const defaultEdgeOptions = useMemo(
		() => ({
			type: 'smoothstep',
			style: {
				stroke: '#000',
				strokeWidth: 3,
			},
			markerEnd: {
				type: MarkerType.ArrowClosed,
				color: '#000',
				width: 20,
				height: 20,
			},
		}),
		[],
	);

	return (
		<div className="relative h-full bg-cream">
			{/* Custom dot grid background */}
			<div
				className="absolute inset-0 opacity-40 pointer-events-none"
				style={{
					backgroundImage:
						'radial-gradient(circle, #d4d4d4 1px, transparent 1px)',
					backgroundSize: '20px 20px',
				}}
			/>

			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onNodeClick={onNodeClick}
				defaultEdgeOptions={defaultEdgeOptions}
				fitView
				className="workflow-canvas"
			>
				{/* Hide default background, use custom dot grid */}
				<Background style={{ display: 'none' }} />

				<Controls className="brutalist-controls border-2 border-black shadow-hard-sm bg-white [&_button]:border-2 [&_button]:border-black [&_button:hover]:bg-accent-yellow" />

				<MiniMap
					className="border-2 border-black shadow-hard"
					nodeColor={nodeColor}
					pannable
					zoomable
				/>
			</ReactFlow>
		</div>
	);
}
