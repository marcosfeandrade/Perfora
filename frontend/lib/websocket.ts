"use client";

import { io, Socket } from "socket.io-client";

const getWsUrl = () => {
  if (typeof window === "undefined") return "";
  return process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
};

let agileSocket: Socket | null = null;
let notesSocket: Socket | null = null;

export function getAgileSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const url = getWsUrl();
  if (!url) return null;
  if (!agileSocket) {
    agileSocket = io(`${url.replace(/\/$/, "")}/agile`, { autoConnect: true });
  }
  return agileSocket;
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

export function onBacklogUpdate(cb: () => void) {
  const s = getAgileSocket();
  if (!s) return () => {};
  s.on("backlog-update", cb);
  return () => s.off("backlog-update", cb);
}

export function onBoardsListUpdate(cb: () => void) {
  const s = getAgileSocket();
  if (!s) return () => {};
  s.on("boards-list-update", cb);
  return () => s.off("boards-list-update", cb);
}

export function getNotesSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const url = getWsUrl();
  if (!url) return null;
  if (!notesSocket) {
    notesSocket = io(`${url.replace(/\/$/, "")}/notes`, { autoConnect: true });
  }
  return notesSocket;
}

export function joinNotesWorkspace(workspaceId: string) {
  const s = getNotesSocket();
  const payload = { workspaceId };
  if (s?.connected) s.emit("join-workspace", payload);
  else s?.on("connect", () => s.emit("join-workspace", payload));
}

export function leaveNotesWorkspace(workspaceId: string) {
  getNotesSocket()?.emit("leave-workspace", { workspaceId });
}

export function onNoteUpdate(cb: (note: unknown) => void) {
  const s = getNotesSocket();
  if (!s) return () => {};
  s.on("note-update", cb);
  return () => s.off("note-update", cb);
}

export function onNotesStructureUpdate(cb: (payload: { workspaceId: string }) => void) {
  const s = getNotesSocket();
  if (!s) return () => {};
  s.on("notes-structure-update", cb);
  return () => s.off("notes-structure-update", cb);
}
