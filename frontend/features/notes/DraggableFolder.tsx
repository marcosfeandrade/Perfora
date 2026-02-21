"use client";

import { useDraggable } from "@dnd-kit/core";
import { Folder, FolderOpen } from "lucide-react";
import type { NoteFolder } from "@/lib/types";
import { folderDragId } from "./NotesSidebarDnd";
import { cn } from "@/lib/utils";

type DraggableFolderProps = {
  folder: NoteFolder;
  isExpanded: boolean;
  children: React.ReactNode;
  className?: string;
};

export function DraggableFolder({
  folder,
  isExpanded,
  children,
  className,
}: DraggableFolderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: folderDragId(folder.id),
    data: { folder },
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
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50",
        className
      )}
    >
      {children}
    </div>
  );
}
