import { io, Socket } from "socket.io-client";
import { cookieStorage } from "./cookie-storage";

// Socket.IO needs the base origin (no /api path), since it connects via /socket.io/
const SERVER_URL =
  import.meta.env.VITE_WS_URL ||
  (import.meta.env.VITE_API_URL
    ? new URL(import.meta.env.VITE_API_URL).origin
    : typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:3002`
      : "http://localhost:3002");

let socket: Socket | null = null;

// Injected by auth-store.ts to avoid a circular import (auth-store imports disconnectSocket from here)
let _refreshAccessToken: (() => Promise<void>) | null = null;
export const setTokenRefresher = (fn: () => Promise<void>) => {
  _refreshAccessToken = fn;
};

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

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected", reason);
    // "io server disconnect" means the server explicitly closed the connection (e.g. expired token).
    // Socket.IO will NOT auto-reconnect in this case, so we refresh the token and reconnect manually.
    if (reason === "io server disconnect" && _refreshAccessToken) {
      _refreshAccessToken()
        .then(() => {
          const newToken = getTokenFromCookie();
          if (newToken && socket) {
            socket.auth = { token: newToken };
            socket.connect();
          }
        })
        .catch(() => {
          // Refresh failed — auth-store.refreshAccessToken already calls logout()
        });
    }
  });

  socket.on("connect_error", (err: any) => {
    console.error("Socket connection error:", err);
  });

  // Before each auto-reconnect attempt, pull the freshest token from the cookie.
  // This covers the case where an HTTP request already refreshed the token but socket.auth is stale.
  socket.io.on("reconnect_attempt", () => {
    const latestToken = getTokenFromCookie();
    if (latestToken && socket) {
      socket.auth = { token: latestToken };
    }
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

const joinWorkflowsList = () => {
  const s = getSocket();
  s.emit("joinWorkflowsList");
};

const leaveWorkflowsList = () => {
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

const onWorkflowsListUpdated = (
  callback: (data: any) => void,
): (() => void) => {
  const s = getSocket();
  s.on("workflows:list:updated", callback);
  return () => s.off("workflows:list:updated", callback);
};
