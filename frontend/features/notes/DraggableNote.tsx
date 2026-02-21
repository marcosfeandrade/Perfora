"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { FileText, Pin, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import type { Note } from "@/lib/types";
import { noteDragId } from "./NotesSidebarDnd";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DraggableNoteProps = {
  note: Note;
  workspaceId: string;
  activeNoteId: string | null;
  showPin?: boolean;
  onRename?: (id: string, title: string) => void;
  onDelete?: (id: string) => void;
};

export function DraggableNote({
  note,
  workspaceId,
  activeNoteId,
  showPin = false,
  onRename,
  onDelete,
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
      className={cn(
        "flex items-center gap-1 rounded-md group",
        isDragging && "opacity-50",
        activeNoteId === note.id
          ? "bg-primary/10 text-primary border-l-2 border-l-primary"
          : "text-foreground hover:bg-accent"
      )}
    >
      <div
        {...listeners}
        {...attributes}
        className="flex items-center gap-2 flex-1 min-w-0 px-2 py-1.5 cursor-grab active:cursor-grabbing"
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
      {(onRename || onDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover:opacity-100 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onRename && (
              <DropdownMenuItem onClick={() => onRename(note.id, note.title)}>
                <Pencil className="size-4 mr-2" />
                Renomear
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(note.id)}
                className="text-destructive"
              >
                <Trash2 className="size-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
