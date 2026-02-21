"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Column as ColumnType } from "@/lib/types";
import { KanbanCard } from "./KanbanCard";
import { CreateCardForm } from "./CreateCardForm";
import { ColumnMenu } from "./ColumnMenu";

type KanbanColumnProps = {
  column: ColumnType;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  allUsers: { id: string; email: string; name: string | null }[];
  isDragging?: boolean;
  onAddCard: (title: string) => void | Promise<unknown>;
  onAssigneesChange: (cardId: string, assigneeIds: string[]) => Promise<void>;
  onTitleChange?: (cardId: string, title: string) => Promise<void>;
  onDescriptionChange?: (cardId: string, description: string) => Promise<void>;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onSetWipLimit: (limit: number | null) => void;
  onDelete: () => void;
};

export function KanbanColumn({
  column,
  canMoveLeft,
  canMoveRight,
  allUsers,
  onAddCard,
  onAssigneesChange,
  onTitleChange,
  onDescriptionChange,
  isDragging,
  onMoveLeft,
  onMoveRight,
  onSetWipLimit,
  onDelete,
}: KanbanColumnProps) {
  const [hover, setHover] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`flex-shrink-0 w-72 flex flex-col rounded-lg bg-surface/80 border transition-colors ${
        isOver ? "border-accent ring-2 ring-accent/30" : "border-white/10"
      }`}
    >
      <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2 group">
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-text truncate">{column.name}</h2>
          {(column.wipLimit ?? null) != null && (
            <p className="text-muted text-xs mt-0.5">
              WIP: {(column.cards ?? []).length}/{column.wipLimit ?? 0}
            </p>
          )}
        </div>
        {hover && (
          <ColumnMenu
            column={column}
            canMoveLeft={canMoveLeft}
            canMoveRight={canMoveRight}
            onMoveLeft={onMoveLeft}
            onMoveRight={onMoveRight}
            onSetWipLimit={onSetWipLimit}
            onDelete={onDelete}
          />
        )}
      </div>
      <div
        className={`flex-1 p-2 min-h-[120px] space-y-2 ${
          isDragging ? "overflow-hidden" : "overflow-y-auto"
        }`}
      >
        {(column.cards ?? []).map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            allUsers={allUsers}
            onAssigneesChange={onAssigneesChange}
            onTitleChange={onTitleChange}
            onDescriptionChange={onDescriptionChange}
          />
        ))}
        <CreateCardForm columnId={column.id} onSubmit={onAddCard} />
      </div>
    </div>
  );
}
