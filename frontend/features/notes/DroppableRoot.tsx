"use client";

import { useDroppable } from "@dnd-kit/core";
import { ROOT_ID } from "./NotesSidebarDnd";
import { cn } from "@/lib/utils";

type DroppableRootProps = {
  children: React.ReactNode;
  className?: string;
};

export function DroppableRoot({ children, className }: DroppableRootProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: ROOT_ID,
    data: { type: "root" },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-md transition-colors min-h-[24px]",
        isOver && "ring-2 ring-primary/30 bg-primary/5",
        className
      )}
    >
      {children}
    </div>
  );
}
