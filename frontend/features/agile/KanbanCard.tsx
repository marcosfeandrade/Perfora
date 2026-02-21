"use client";

import { useCallback, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { Card as CardType, CardAssignee } from "@/lib/types";
import { CardAssigneePicker } from "./CardAssigneePicker";
import { CardDetailModal } from "./CardDetailModal";

type KanbanCardProps = {
  card: CardType;
  allUsers: { id: string; email: string; name: string | null }[];
  onAssigneesChange: (cardId: string, assigneeIds: string[]) => Promise<void>;
  onTitleChange?: (cardId: string, title: string) => Promise<void>;
  onDescriptionChange?: (cardId: string, description: string) => Promise<void>;
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
  allUsers,
  onAssigneesChange,
  onTitleChange,
  onDescriptionChange,
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
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={() => !isDragging && setModalOpen(true)}
        className={`rounded-lg bg-background border border-white/10 p-3 cursor-grab active:cursor-grabbing transition-shadow ${
          isDragging ? "opacity-0" : "hover:border-primary/50"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-text font-medium text-sm">{card.title}</p>
            {card.description ? (
              <p className="text-muted text-xs mt-1 line-clamp-2 whitespace-pre-line break-words">
                {card.description}
              </p>
            ) : null}
          </div>
          <div
            className="flex-shrink-0 flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {assignees.slice(0, 2).map((a) => (
              <span
                key={a.id}
                className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-[10px] text-accent"
                title={a.name || a.email}
              >
                {(a.name || a.email)?.[0]?.toUpperCase() ?? "?"}
              </span>
            ))}
            {assignees.length > 2 && (
              <span className="text-[10px] text-muted">+{assignees.length - 2}</span>
            )}
            <CardAssigneePicker
              cardId={card.id}
              assignees={assignees}
              allUsers={allUsers}
              onAssigneesChange={onAssigneesChange}
            />
          </div>
        </div>
      </div>
      {modalOpen && (
        <CardDetailModal
          card={card}
          onClose={() => setModalOpen(false)}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
        />
      )}
    </>
  );
}
