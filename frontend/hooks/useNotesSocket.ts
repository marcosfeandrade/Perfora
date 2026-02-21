"use client";

import { useEffect, useRef } from "react";
import type { Note } from "@/lib/types";
import {
  joinNotesWorkspace,
  leaveNotesWorkspace,
  onNoteUpdate,
  onNotesStructureUpdate,
} from "@/lib/websocket";

export function useNotesRealtime(
  workspaceId: string | null,
  noteId: string | null,
  onNote: (note: Note) => void
) {
  const onNoteRef = useRef(onNote);
  onNoteRef.current = onNote;

  useEffect(() => {
    if (!workspaceId || !noteId) return;
    joinNotesWorkspace(workspaceId);
    const unsubscribe = onNoteUpdate((payload) => {
      const n = payload as Note;
      if (n?.id === noteId) {
        onNoteRef.current(n);
      }
    });
    return () => {
      unsubscribe();
      leaveNotesWorkspace(workspaceId);
    };
  }, [workspaceId, noteId]);
}

export function useNotesStructureRealtime(
  workspaceId: string | null,
  onRefresh: () => void
) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!workspaceId) return;
    joinNotesWorkspace(workspaceId);
    const unsubscribe = onNotesStructureUpdate((payload) => {
      if (payload?.workspaceId === workspaceId) {
        onRefreshRef.current();
      }
    });
    return () => {
      unsubscribe();
      leaveNotesWorkspace(workspaceId);
    };
  }, [workspaceId]);
}
