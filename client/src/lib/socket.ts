import { io, Socket } from "socket.io-client";
import { cookieStorage } from "./cookie-storage";

// Socket.IO needs the base origin (no /api path), since it connects via /socket.io/
const SERVER_URL =
  import.meta.env.VITE_WS_URL ||
  (import.meta.env.VITE_API_URL
    ? new URL(import.meta.env.VITE_API_URL).origin
    : typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : "http://localhost:3001");

let socket: Socket | null = null;

const getTokenFromCookie = (): string | undefined => {
  try {
    const raw = cookieStorage.getItem("auth-storage");
    if (raw) {
      const parsed = JSON.parse(decodeURIComponent(raw));
      return parsed?.state?.accessToken ?? undefined;
    }
  } catch {
    // ignore parse errors
  }
  return undefined;
};

export const getSocket = (token?: string): Socket => {
  const resolvedToken = token ?? getTokenFromCookie();

  if (socket) {
    // If token changed and socket is disconnected, update auth and reconnect
    if (resolvedToken && (socket.auth as any)?.token !== resolvedToken) {
      socket.auth = { token: resolvedToken };
      if (!socket.connected) socket.connect();
    }
    return socket;
  }

  socket = io(SERVER_URL + "/runs", {
    transports: ["websocket"],
    autoConnect: true,
    auth: { token: resolvedToken },
  });

  socket.on("connect", () => {
    console.log("Socket scheduled connection established", socket?.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (err: any) => {
    console.error("Socket connection error:", err);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Workflow room management
export const joinWorkflow = (workflowId: string) => {
  const s = getSocket();
  s.emit("joinWorkflow", { workflowId });
};

export const leaveWorkflow = (workflowId: string) => {
  const s = getSocket();
  s.emit("leaveWorkflow", { workflowId });
};

export const joinWorkflowExecution = (executionId: string) => {
  const s = getSocket();
  s.emit("joinWorkflowExecution", { executionId });
};

export const leaveWorkflowExecution = (executionId: string) => {
  const s = getSocket();
  s.emit("leaveWorkflowExecution", { executionId });
};

export const joinWorkflowsList = () => {
  const s = getSocket();
  s.emit("joinWorkflowsList");
};

export const leaveWorkflowsList = () => {
  const s = getSocket();
  s.emit("leaveWorkflowsList");
};

// Workflow event listeners
export const onWorkflowExecutionStarted = (
  callback: (data: any) => void,
): (() => void) => {
  const s = getSocket();
  s.on("workflow:execution:started", callback);
  return () => s.off("workflow:execution:started", callback);
};

export const onWorkflowExecutionCompleted = (
  callback: (data: any) => void,
): (() => void) => {
  const s = getSocket();
  s.on("workflow:execution:completed", callback);
  return () => s.off("workflow:execution:completed", callback);
};

export const onWorkflowExecutionFailed = (
  callback: (data: any) => void,
): (() => void) => {
  const s = getSocket();
  s.on("workflow:execution:failed", callback);
  return () => s.off("workflow:execution:failed", callback);
};

export const onWorkflowNodeStarted = (
  callback: (data: any) => void,
): (() => void) => {
  const s = getSocket();
  s.on("workflow:node:started", callback);
  return () => s.off("workflow:node:started", callback);
};

export const onWorkflowNodeCompleted = (
  callback: (data: any) => void,
): (() => void) => {
  const s = getSocket();
  s.on("workflow:node:completed", callback);
  return () => s.off("workflow:node:completed", callback);
};

export const onWorkflowNodeFailed = (
  callback: (data: any) => void,
): (() => void) => {
  const s = getSocket();
  s.on("workflow:node:failed", callback);
  return () => s.off("workflow:node:failed", callback);
};

export const onWorkflowsListUpdated = (
  callback: (data: any) => void,
): (() => void) => {
  const s = getSocket();
  s.on("workflows:list:updated", callback);
  return () => s.off("workflows:list:updated", callback);
};
