"use client";

import { useRef, useCallback } from "react";
import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { FileText, Pin } from "lucide-react";
import type { Note } from "@/lib/types";
import { noteDragId } from "./NotesSidebarDnd";
import { cn } from "@/lib/utils";

type DraggableNoteProps = {
  note: Note;
  workspaceId: string;
  activeNoteId: string | null;
  showPin?: boolean;
};

export function DraggableNote({
  note,
  workspaceId,
  activeNoteId,
  showPin = false,
}: DraggableNoteProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: noteDragId(note.id),
    data: { note },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-200 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50",
        activeNoteId === note.id
          ? "bg-primary/10 text-primary border-l-2 border-l-primary"
          : "text-foreground hover:bg-accent"
      )}
    >
      {showPin || note.isPinned ? (
        <Pin className="size-3.5 shrink-0" />
      ) : (
        <FileText className="size-4 shrink-0" />
      )}
      <Link
        href={`/workspace/${workspaceId}/notes/${note.id}`}
        className="flex-1 min-w-0 truncate"
        onClick={(e) => e.stopPropagation()}
      >
        {note.title}
      </Link>
    </div>
  );
}
