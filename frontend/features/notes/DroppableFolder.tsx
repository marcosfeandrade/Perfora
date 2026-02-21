"use client";

import { useDroppable } from "@dnd-kit/core";
import { folderDropId } from "./NotesSidebarDnd";
import { cn } from "@/lib/utils";

type DroppableFolderProps = {
  folderId: string;
  isOver?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function DroppableFolder({
  folderId,
  isOver,
  children,
  className,
}: DroppableFolderProps) {
  const { setNodeRef, isOver: isOverState } = useDroppable({
    id: folderDropId(folderId),
    data: { folderId },
  });

  const over = isOver ?? isOverState;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-md transition-colors",
        over && "ring-2 ring-primary/30 bg-primary/5",
        className
      )}
    >
      {children}
    </div>
  );
}
