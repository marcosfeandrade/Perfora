"use client";

import { io, Socket } from "socket.io-client";

const getWsUrl = () => {
  if (typeof window === "undefined") return "";
  return process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
};

let socket: Socket | null = null;

export function getAgileSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const url = getWsUrl();
  if (!url) return null;
  if (!socket) {
    socket = io(`${url.replace(/\/$/, "")}/agile`, { autoConnect: true });
  }
  return socket;
}

export function joinWorkspaceRoom(workspaceId: string) {
  const s = getAgileSocket();
  const payload = { workspaceId };
  if (s?.connected) s.emit("join-workspace", payload);
  else s?.on("connect", () => s.emit("join-workspace", payload));
}

export function leaveWorkspaceRoom(workspaceId: string) {
  getAgileSocket()?.emit("leave-workspace", { workspaceId });
}

export function onBoardUpdate(cb: (board: unknown) => void) {
  const s = getAgileSocket();
  if (!s) return () => {};
  s.on("board-update", cb);
  return () => s.off("board-update", cb);
}
