import { io, Socket } from "socket.io-client";

const SERVER_URL =
  import.meta.env.VITE_WS_URL ||
  (import.meta.env.VITE_API_URL
    ? new URL(import.meta.env.VITE_API_URL).origin
    : typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : "http://localhost:3001");

let demoSocket: Socket | null = null;

export const getDemoSocket = (demoToken: string): Socket => {
  if (demoSocket) {
    demoSocket.disconnect();
    demoSocket = null;
  }

  demoSocket = io(SERVER_URL + "/runs", {
    transports: ["websocket"],
    autoConnect: true,
    auth: { token: demoToken },
  });

  return demoSocket;
};

export const joinDemoRun = (runId: string) => {
  if (demoSocket) {
    demoSocket.emit("joinRun", { runId });
  }
};

export const onDemoRunUpdated = (
  callback: (data: any) => void,
): (() => void) => {
  if (!demoSocket) return () => {};
  demoSocket.on("run:updated", callback);
  return () => demoSocket?.off("run:updated", callback);
};

const onDemoRunLog = (
  callback: (data: any) => void,
): (() => void) => {
  if (!demoSocket) return () => {};
  demoSocket.on("run:log", callback);
  return () => demoSocket?.off("run:log", callback);
};

export const disconnectDemoSocket = () => {
  if (demoSocket) {
    demoSocket.disconnect();
    demoSocket = null;
  }
};
