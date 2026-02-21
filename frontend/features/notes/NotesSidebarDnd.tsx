"use client";

import { useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { api } from "@/lib/api";
import type { NoteFolder, Note } from "@/lib/types";

const FOLDER_PREFIX = "folder-";
const NOTE_PREFIX = "note-";
export const ROOT_ID = "root";

export function parseDragId(id: string): { type: "folder" | "note"; id: string } | null {
  if (id.startsWith(FOLDER_PREFIX)) return { type: "folder", id: id.slice(FOLDER_PREFIX.length) };
  if (id.startsWith(NOTE_PREFIX)) return { type: "note", id: id.slice(NOTE_PREFIX.length) };
  return null;
}

export function folderDragId(id: string) {
  return `${FOLDER_PREFIX}${id}`;
}

export function noteDragId(id: string) {
  return `${NOTE_PREFIX}${id}`;
}

export function parseDropId(id: string): { type: "folder" | "root"; id: string | null } | null {
  if (id === ROOT_ID) return { type: "root", id: null };
  if (id.startsWith(FOLDER_PREFIX)) return { type: "folder", id: id.slice(FOLDER_PREFIX.length) };
  return null;
}

export function folderDropId(id: string) {
  return `${FOLDER_PREFIX}${id}`;
}

type NotesSidebarDndProps = {
  workspaceId: string;
  onDrop: () => void;
  children: React.ReactNode;
};

export function NotesSidebarDnd({
  workspaceId,
  onDrop,
  children,
}: NotesSidebarDndProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const drag = parseDragId(String(active.id));
      const drop = parseDropId(String(over.id));
      if (!drag || !drop) return;

      if (drop.type === "folder" && drop.id === drag.id && drag.type === "folder") return;

      try {
        if (drag.type === "note") {
          const folderId = drop.type === "root" ? null : drop.id;
          await api.notes.notes.move(drag.id, { folderId });
        } else {
          const parentId = drop.type === "root" ? null : drop.id;
          await api.notes.folders.move(drag.id, { parentId });
        }
        onDrop();
      } catch {
        //
      }
    },
    [onDrop]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {children}
    </DndContext>
  );
}
