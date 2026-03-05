import { useEffect, useState } from "react";
import {
	joinWorkflowExecution,
	leaveWorkflowExecution,
	onWorkflowExecutionStarted,
	onWorkflowExecutionCompleted,
	onWorkflowExecutionFailed,
	onWorkflowNodeStarted,
	onWorkflowNodeCompleted,
	onWorkflowNodeFailed,
} from "../lib/socket";

interface NodeExecution {
	id: string;
	executionId: string;
	nodeId: string;
	nodeType: string;
	status: "pending" | "running" | "success" | "failed" | "skipped";
	inputData?: any;
	outputData?: any;
	errorMessage?: string;
	durationMs?: number;
	startedAt?: string;
	completedAt?: string;
}

interface WorkflowExecution {
	id: string;
	workflowId: string;
	status: "pending" | "running" | "success" | "failed" | "cancelled";
	triggerPayload?: any;
	executionData?: any;
	errorMessage?: string;
	startedAt?: string;
	completedAt?: string;
}

export const useWorkflowExecution = (executionId: string | null) => {
	const [execution, setExecution] = useState<WorkflowExecution | null>(null);
	const [nodeExecutions, setNodeExecutions] = useState<
		Map<string, NodeExecution>
	>(new Map());
	const [executionOrder, setExecutionOrder] = useState<string[]>([]);

	useEffect(() => {
		if (!executionId) return;

		// Join room
		joinWorkflowExecution(executionId);

		// Listen to execution events
		const unsubStarted = onWorkflowExecutionStarted((data) => {
			if (data.id === executionId) {
				setExecution(data);
			}
		});

		const unsubCompleted = onWorkflowExecutionCompleted((data) => {
			if (data.id === executionId) {
				setExecution(data);
			}
		});

		const unsubFailed = onWorkflowExecutionFailed((data) => {
			if (data.execution.id === executionId) {
				setExecution(data.execution);
			}
		});

		// Listen to node events
		const unsubNodeStarted = onWorkflowNodeStarted((nodeExec: NodeExecution) => {
			if (nodeExec.executionId === executionId) {
				setNodeExecutions((prev) => {
					const updated = new Map(prev);
					updated.set(nodeExec.nodeId, nodeExec);
					return updated;
				});
				setExecutionOrder((prev) =>
					prev.includes(nodeExec.nodeId) ? prev : [...prev, nodeExec.nodeId],
				);
			}
		});

		const unsubNodeCompleted = onWorkflowNodeCompleted(
			(nodeExec: NodeExecution) => {
				if (nodeExec.executionId === executionId) {
					setNodeExecutions((prev) => {
						const updated = new Map(prev);
						updated.set(nodeExec.nodeId, nodeExec);
						return updated;
					});
				}
			},
		);

		const unsubNodeFailed = onWorkflowNodeFailed((data: any) => {
			const nodeExec = data.nodeExecution;
			if (nodeExec.executionId === executionId) {
				setNodeExecutions((prev) => {
					const updated = new Map(prev);
					updated.set(nodeExec.nodeId, nodeExec);
					return updated;
				});
			}
		});

		return () => {
			leaveWorkflowExecution(executionId);
			unsubStarted();
			unsubCompleted();
			unsubFailed();
			unsubNodeStarted();
			unsubNodeCompleted();
			unsubNodeFailed();
		};
	}, [executionId]);

	return {
		execution,
		nodeExecutions,
		executionOrder,
		getNodeStatus: (nodeId: string) =>
			nodeExecutions.get(nodeId)?.status || "idle",
	};
};
