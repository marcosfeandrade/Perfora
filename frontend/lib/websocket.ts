import { io, Socket } from "socket.io-client";

const WS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000")
    : "";

let socket: Socket | null = null;

export function getAgileSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (!socket) {
    socket = io(WS_URL + "/agile", {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}

export function joinWorkspaceRoom(workspaceId: string): void {
  const s = getAgileSocket();
  if (s?.connected) {
    s.emit("join-workspace", { workspaceId });
  } else {
    s?.once("connect", () => {
      s.emit("join-workspace", { workspaceId });
    });
  }
}

export function leaveWorkspaceRoom(workspaceId: string): void {
  getAgileSocket()?.emit("leave-workspace", { workspaceId });
}

export function onBoardUpdate(callback: (board: unknown) => void): () => void {
  const s = getAgileSocket();
  if (!s) return () => {};
  s.on("board-update", callback);
  return () => {
    s.off("board-update", callback);
  };
}
