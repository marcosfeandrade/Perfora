"use client";

import { useCallback, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { Card as CardType, CardAssignee } from "@/lib/types";
import { CardAssigneePicker } from "./CardAssigneePicker";
import { CardDetailModal } from "./CardDetailModal";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KanbanCardProps = {
  card: CardType;
  workspaceId: string;
  allUsers: { id: string; email: string; name: string | null }[];
  onAssigneesChange: (cardId: string, assigneeIds: string[]) => Promise<void>;
  onTitleChange?: (cardId: string, title: string) => Promise<void>;
  onDescriptionChange?: (cardId: string, description: string) => Promise<void>;
  onLabelsChange?: (cardId: string, labels: string[]) => Promise<void>;
  onStartDateChange?: (cardId: string, date: string | null) => Promise<void>;
  onDueDateChange?: (cardId: string, date: string | null) => Promise<void>;
};

function normalizeAssignees(
  assignees: CardType["assignees"]
): CardAssignee[] {
  if (!assignees?.length) return [];
  return assignees.map((a): CardAssignee => {
    const item = a as { user?: CardAssignee };
    return item.user ?? (a as CardAssignee);
  });
}

export function KanbanCard({
  card,
  workspaceId,
  allUsers,
  onAssigneesChange,
  onTitleChange,
  onDescriptionChange,
  onLabelsChange,
  onStartDateChange,
  onDueDateChange,
}: KanbanCardProps) {
  const { setNodeRef: setDroppableRef } = useDroppable({ id: card.id });
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: card.id,
    data: { columnId: card.columnId, card },
  });
  const setNodeRef = useCallback(
    (el: HTMLElement | null) => {
      setDroppableRef(el);
      setDraggableRef(el);
    },
    [setDroppableRef, setDraggableRef]
  );

  const assignees = normalizeAssignees(card.assignees);
  const [modalOpen, setModalOpen] = useState(false);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={() => !isDragging && setModalOpen(true)}
        className={cn(
          "p-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md",
          isDragging ? "opacity-0" : "hover:border-primary/50"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-medium text-sm">{card.title}</p>
            {card.code && (
              <p className="text-muted-foreground text-xs mt-0.5">{card.code}</p>
            )}
            {(card.labels as string[])?.length ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {(card.labels as string[]).slice(0, 3).map((l) => (
                  <span
                    key={l}
                    className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary"
                  >
                    {l}
                  </span>
                ))}
                {(card.labels as string[]).length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{(card.labels as string[]).length - 3}
                  </span>
                )}
              </div>
            ) : null}
          </div>
          <div
            className="flex-shrink-0 flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {assignees.slice(0, 2).map((a) => (
              <span
                key={a.id}
                className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary"
                title={a.name || a.email}
              >
                {(a.name || a.email)?.[0]?.toUpperCase() ?? "?"}
              </span>
            ))}
            {assignees.length > 2 && (
              <span className="text-[10px] text-muted-foreground">+{assignees.length - 2}</span>
            )}
            <CardAssigneePicker
              cardId={card.id}
              assignees={assignees}
              allUsers={allUsers}
              onAssigneesChange={onAssigneesChange}
            />
          </div>
        </div>
      </Card>
      {modalOpen && (
        <CardDetailModal
          card={card}
          workspaceId={workspaceId}
          allUsers={allUsers}
          onClose={() => setModalOpen(false)}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
          onAssigneesChange={onAssigneesChange}
          onLabelsChange={onLabelsChange}
          onStartDateChange={onStartDateChange}
          onDueDateChange={onDueDateChange}
        />
      )}
    </>
  );
}
