import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  ReactFlowProvider,
} from "@xyflow/react";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { NodePalette } from "@/components/workflow/NodePalette";
import { NodeConfigPanel } from "@/components/workflow/NodeConfigPanel";
import { WorkflowToolbar } from "@/components/workflow/WorkflowToolbar";
import { ExecutionStatusPanel } from "@/components/workflow/ExecutionStatusPanel";
import {
  TriggerNode,
  ProcessorNode,
  ActionNode,
} from "@/components/workflow/nodes";
import {
  useWorkflowsControllerFindOne,
  useWorkflowsControllerUpdate,
  useWorkflowsControllerActivate,
  useWorkflowsControllerPause,
  useWorkflowsControllerGetExecutions,
  useWorkflowsControllerTrigger,
} from "@/api/endpoints/workflows/workflows";
import { toast } from "sonner";
import { useWorkflowExecution } from "@/hooks/useWorkflowExecution";
import { joinWorkflow, leaveWorkflow } from "@/lib/socket";

export const Route = createFileRoute("/autoruns/builder/$id")({
  component: WorkflowBuilder,
});

const nodeTypes = {
  trigger: TriggerNode,
  processor: ProcessorNode,
  action: ActionNode,
};

function WorkflowBuilder() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState("New Workflow");
  const [workflowStatus, setWorkflowStatus] = useState<
    "draft" | "active" | "paused"
  >("draft");
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(
    null,
  );
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const dragDataRef = useRef<{
    type: string;
    category: string;
    label: string;
  } | null>(null);

  const { data: response, isLoading } = useWorkflowsControllerFindOne(id, {
    query: { enabled: id !== "new" },
  });
  const workflow = response?.data as unknown as any;

  const updateWorkflow = useWorkflowsControllerUpdate();
  const activateWorkflow = useWorkflowsControllerActivate();
  const pauseWorkflow = useWorkflowsControllerPause();
  const triggerWorkflow = useWorkflowsControllerTrigger();

  const { data: executionResponse, refetch: refetchExecutions } =
    useWorkflowsControllerGetExecutions(id, {
      query: { enabled: id !== "new" },
    });
  const executions = executionResponse?.data as unknown as any[];

  // Live execution tracking
  const { execution, nodeExecutions, executionOrder, getNodeStatus } =
    useWorkflowExecution(currentExecutionId);

  // Load workflow data
  useEffect(() => {
    if (workflow) {
      setWorkflowName(workflow.name);
      setWorkflowStatus(workflow.status as "draft" | "active" | "paused");

      // Load nodes and edges from workflow definition
      if (workflow.definition) {
        const loadedNodes = workflow.definition.nodes.map((node: any) => ({
          id: node.id,
          type: node.type.includes("trigger")
            ? "trigger"
            : node.type.includes("filter") || node.type.includes("transform")
              ? "processor"
              : "action",
          position: node.position,
          data: {
            label: node.params.label || node.type,
            type: node.type,
            params: node.params,
            status: "idle", // Will be updated by live execution
          },
        }));

        const loadedEdges = workflow.definition.connections.map(
          (conn: any) => ({
            id: conn.id,
            source: conn.source,
            target: conn.target,
            sourceHandle: conn.sourceHandle,
            targetHandle: conn.targetHandle,
          }),
        );

        setNodes(loadedNodes);
        setEdges(loadedEdges);
      }
    }
  }, [workflow, setNodes, setEdges]);

  // Join workflow room for real-time updates
  useEffect(() => {
    if (id && id !== "new") {
      joinWorkflow(id);
      return () => leaveWorkflow(id);
    }
  }, [id]);

  // Track latest execution
  useEffect(() => {
    if (executions && executions.length > 0) {
      const latest = executions[0];
      // Only track running executions
      if (latest.status === "running" || latest.status === "pending") {
        setCurrentExecutionId(latest.id);
      }
    }
  }, [executions]);

  // Update node statuses based on live execution
  useEffect(() => {
    if (!execution) return;

    setNodes((nds) =>
      nds.map((node) => {
        const status = getNodeStatus(node.id);
        return {
          ...node,
          data: {
            ...node.data,
            status: status === "idle" ? "idle" : status,
          },
        };
      }),
    );
  }, [nodeExecutions, getNodeStatus, setNodes, execution]);

  // Handle connecting nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges],
  );

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle dragging from palette
  const onNodeDragStart = useCallback(
    (type: string, category: string, label: string) => {
      dragDataRef.current = { type, category, label };
    },
    [],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
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
    (nodeId: string, updates: Partial<Node["data"]>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...(node.data as any), ...updates } }
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
    navigate({ to: "/autoruns" });
  }, [navigate]);

  const handleSave = useCallback(async () => {
    try {
      // Convert nodes and edges to workflow definition format
      const definition = {
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.data.type as string,
          position: node.position,
          params: { ...(node.data.params as any), label: node.data.label },
        })),
        connections: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle ?? undefined,
          targetHandle: edge.targetHandle ?? undefined,
        })),
      };

      await updateWorkflow.mutateAsync({
        id,
        data: {
          name: workflowName,
          definition,
        },
      });

      toast.success("Workflow saved successfully");
    } catch (error) {
      toast.error("Failed to save workflow");
      console.error("Save error:", error);
    }
  }, [nodes, edges, workflowName, id, updateWorkflow]);

  const handleTest = useCallback(async () => {
    try {
      // Save workflow before testing
      await handleSave();

      // Trigger workflow execution
      await triggerWorkflow.mutateAsync({ id });

      toast.success("Workflow execution started! Watch nodes animate.");

      // Refetch executions to get the new execution ID
      setTimeout(() => refetchExecutions(), 500);
    } catch (error: any) {
      toast.error(error.message || "Failed to trigger workflow");
    }
  }, [id, triggerWorkflow, handleSave, refetchExecutions]);

  const handleActivate = useCallback(async () => {
    try {
      await activateWorkflow.mutateAsync({ id });
      setWorkflowStatus("active");
      toast.success("Workflow activated");
    } catch (error: any) {
      toast.error(error.message || "Failed to activate workflow");
    }
  }, [id, activateWorkflow]);

  const handlePause = useCallback(async () => {
    try {
      await pauseWorkflow.mutateAsync({ id });
      setWorkflowStatus("paused");
      toast.success("Workflow paused");
    } catch (error: any) {
      toast.error(error.message || "Failed to pause workflow");
    }
  }, [id, pauseWorkflow]);

  if (isLoading && id !== "new") {
    return (
      <div className="h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4" />
          <p className="font-display font-bold uppercase">
            Loading workflow...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-cream w-screen">
      <WorkflowToolbar
        workflowName={workflowName}
        workflowStatus={workflowStatus}
        onBack={handleBack}
        onSave={handleSave}
        onTest={handleTest}
        onActivate={handleActivate}
        onPause={handlePause}
        isSaving={updateWorkflow.isPending}
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

      {/* Floating Execution Status Panel */}
      <ExecutionStatusPanel
        execution={execution}
        executionOrder={executionOrder}
        nodeExecutions={nodeExecutions}
      />
    </div>
  );
}
