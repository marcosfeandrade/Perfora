"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Column as ColumnType } from "@/lib/types";
import { KanbanCard } from "./KanbanCard";
import { CreateCardForm } from "./CreateCardForm";
import { ColumnMenu } from "./ColumnMenu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-72 flex flex-col overflow-hidden transition-all duration-200",
        isOver && "ring-2 ring-primary/30 border-primary/50"
      )}
    >
      <CardHeader className="p-3 border-b border-border flex flex-row items-center justify-between gap-2 group">
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-foreground truncate">{column.name}</h2>
          {(column.wipLimit ?? null) != null && (
            <p className="text-muted-foreground text-xs mt-0.5">
              WIP: {(column.cards ?? []).length}/{column.wipLimit ?? 0}
            </p>
          )}
        </div>
        <ColumnMenu
            column={column}
            canMoveLeft={canMoveLeft}
            canMoveRight={canMoveRight}
            onMoveLeft={onMoveLeft}
            onMoveRight={onMoveRight}
            onSetWipLimit={onSetWipLimit}
            onDelete={onDelete}
          />
      </CardHeader>
      <CardContent
        className={cn(
          "flex-1 p-2 min-h-[120px] space-y-2",
          isDragging ? "overflow-hidden" : "overflow-y-auto"
        )}
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
      </CardContent>
    </Card>
  );
}
