"use client";

import { useEffect, useRef, useState } from "react";
import type { Board } from "@/lib/types";
import {
  getAgileSocket,
  joinWorkspaceRoom,
  leaveWorkspaceRoom,
  onBoardUpdate,
} from "@/lib/websocket";

export function useAgileBoardRealtime(
  workspaceId: string | null,
  boardId: string | null,
  onBoard: (board: Board) => void
) {
  const onBoardRef = useRef(onBoard);
  onBoardRef.current = onBoard;

  useEffect(() => {
    if (!workspaceId || !boardId) return;
    joinWorkspaceRoom(workspaceId);
    const unsubscribe = onBoardUpdate((payload) => {
      const b = payload as Board;
      if (b?.id === boardId) {
        onBoardRef.current(b);
      }
    });
    return () => {
      unsubscribe();
      leaveWorkspaceRoom(workspaceId);
    };
  }, [workspaceId, boardId]);
}

export function useAgileSocketConnected(): boolean {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const s = getAgileSocket();
    if (!s) return;
    setConnected(s.connected);
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    return () => {
      s.off("connect");
      s.off("disconnect");
    };
  }, []);
  return connected;
}
