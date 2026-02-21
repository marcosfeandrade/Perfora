"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { api } from "@/lib/api";
import { useAgileBoardRealtime } from "@/hooks/useAgileSocket";
import type { Board as BoardType, Column, Card as CardType } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";
import { CreateColumnForm } from "./CreateColumnForm";
import { Card } from "@/components/ui/card";

type BoardProps = {
  workspaceId: string;
  boardId: string;
  initialBoard: BoardType;
};

export function KanbanBoard({
  workspaceId,
  boardId,
  initialBoard,
}: BoardProps) {
  const [board, setBoard] = useState<BoardType>(initialBoard);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [allUsers, setAllUsers] = useState<{ id: string; email: string; name: string | null }[]>([]);

  useAgileBoardRealtime(workspaceId, boardId, setBoard);

  useEffect(() => {
    api.auth.users().then(setAllUsers).catch(() => setAllUsers([]));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      document.body.style.overflow = "hidden";
      const card = findCard(board, String(event.active.id));
      if (card) setActiveCard(card);
    },
    [board]
  );

  const handleDragCancel = useCallback(() => {
    setActiveCard(null);
    document.body.style.overflow = "";
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveCard(null);
      document.body.style.overflow = "";
      const { active, over } = event;
      if (!over) return;
      const cardId = String(active.id);
      const overId = String(over.id);
      const card = findCard(board, cardId);
      if (!card) return;
      const target = resolveDropTarget(board, overId, cardId);
      if (!target) return;
      if (target.columnId === card.columnId && target.order === card.order)
        return;
      try {
        await api.agile.cards.move(cardId, {
          targetColumnId: target.columnId,
          order: target.order,
        });
        const freshBoard = await api.agile.boards.get(boardId);
        setBoard(freshBoard);
      } catch {
        setBoard((prev) => ({ ...prev }));
      }
    },
    [board, boardId]
  );

  const handleAddColumn = useCallback(
    (name: string) => {
      const order = board.columns.length;
      return api.agile.columns.create({ name, order, boardId });
    },
    [board.columns.length, boardId]
  );

  const handleMoveColumnLeft = useCallback(
    (columnId: string) => {
      api.agile.columns.moveLeft(columnId).then((board) => setBoard(board));
    },
    []
  );

  const handleMoveColumnRight = useCallback(
    (columnId: string) => {
      api.agile.columns.moveRight(columnId).then((board) => setBoard(board));
    },
    []
  );

  const handleSetWipLimit = useCallback(
    (columnId: string, limit: number | null) => {
      api.agile.columns
        .update(columnId, { wipLimit: limit })
        .then((col) => {
          setBoard((prev) => ({
            ...prev,
            columns: prev.columns.map((c) =>
              c.id === columnId ? { ...c, wipLimit: col.wipLimit ?? null } : c
            ),
          }));
        });
    },
    []
  );

  const handleDeleteColumn = useCallback((columnId: string) => {
    if (!confirm("Deletar esta coluna? Os cards serão removidos.")) return;
    api.agile.columns.delete(columnId).then(() => {
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.filter((c) => c.id !== columnId),
      }));
    });
  }, []);

  const handleTitleChange = useCallback(
    async (cardId: string, title: string) => {
      const updated = await api.agile.cards.update(cardId, { title });
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => ({
          ...col,
          cards: (col.cards ?? []).map((c) =>
            c.id === cardId ? { ...c, title: updated.title } : c
          ),
        })),
      }));
    },
    []
  );

  const handleDescriptionChange = useCallback(
    async (cardId: string, description: string) => {
      const updated = await api.agile.cards.update(cardId, { description });
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => ({
          ...col,
          cards: (col.cards ?? []).map((c) =>
            c.id === cardId ? { ...c, description: updated.description ?? null } : c
          ),
        })),
      }));
    },
    []
  );

  const handleLabelsChange = useCallback(
    async (cardId: string, labels: string[]) => {
      const updated = await api.agile.cards.update(cardId, { labels });
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => ({
          ...col,
          cards: (col.cards ?? []).map((c) =>
            c.id === cardId ? { ...c, labels: updated.labels ?? null } : c
          ),
        })),
      }));
    },
    []
  );

  const handleStartDateChange = useCallback(
    async (cardId: string, date: string | null) => {
      const updated = await api.agile.cards.update(cardId, {
        startDate: date ?? undefined,
      });
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => ({
          ...col,
          cards: (col.cards ?? []).map((c) =>
            c.id === cardId ? { ...c, startDate: updated.startDate ?? null } : c
          ),
        })),
      }));
    },
    []
  );

  const handleDueDateChange = useCallback(
    async (cardId: string, date: string | null) => {
      const updated = await api.agile.cards.update(cardId, {
        dueDate: date ?? undefined,
      });
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => ({
          ...col,
          cards: (col.cards ?? []).map((c) =>
            c.id === cardId ? { ...c, dueDate: updated.dueDate ?? null } : c
          ),
        })),
      }));
    },
    []
  );

  const handleAssigneesChange = useCallback(
    async (cardId: string, assigneeIds: string[]) => {
      const updated = await api.agile.cards.update(cardId, { assigneeIds });
      const rawAssignees = (updated as { assignees?: { user?: { id: string; email: string; name: string | null } }[] }).assignees ?? [];
      const assignees = rawAssignees.map((a) => ("user" in a && a.user ? a.user : a)) as { id: string; email: string; name: string | null }[];
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => ({
          ...col,
          cards: (col.cards ?? []).map((c) =>
            c.id === cardId ? { ...c, assignees } : c
          ),
        })),
      }));
    },
    []
  );

  const handleAddCard = useCallback(
    (columnId: string, title: string) => {
      const column = board.columns.find((c) => c.id === columnId);
      const order = column ? (column.cards?.length ?? 0) : 0;
      return api.agile.cards.create({ title, order, columnId });
    },
    [board.columns]
  );

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-foreground">{board.name}</h1>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          className={`flex gap-4 pb-4 flex-1 min-h-0 ${
            activeCard ? "overflow-hidden" : "overflow-x-auto"
          }`}
        >
          {board.columns.map((col, index) => (
            <KanbanColumn
              key={col.id}
              column={{ ...col, wipLimit: col.wipLimit ?? null }}
              canMoveLeft={index > 0}
              canMoveRight={index < board.columns.length - 1}
              allUsers={allUsers}
              workspaceId={workspaceId}
              isDragging={!!activeCard}
              onAddCard={(title) => handleAddCard(col.id, title)}
              onAssigneesChange={handleAssigneesChange}
              onTitleChange={handleTitleChange}
              onDescriptionChange={handleDescriptionChange}
              onLabelsChange={handleLabelsChange}
              onStartDateChange={handleStartDateChange}
              onDueDateChange={handleDueDateChange}
              onMoveLeft={() => handleMoveColumnLeft(col.id)}
              onMoveRight={() => handleMoveColumnRight(col.id)}
              onSetWipLimit={(limit) => handleSetWipLimit(col.id, limit)}
              onDelete={() => handleDeleteColumn(col.id)}
            />
          ))}
          <div className="flex-shrink-0 w-72">
            <CreateColumnForm onSubmit={handleAddColumn} />
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <Card className="rounded-lg border-2 border-primary p-3 cursor-grabbing shadow-xl w-[272px] opacity-95">
              <p className="text-foreground font-medium text-sm">{activeCard.title}</p>
              {activeCard.code && (
                <p className="text-muted-foreground text-xs mt-0.5">{activeCard.code}</p>
              )}
              {((activeCard.labels as string[]) ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {((activeCard.labels as string[]) ?? []).slice(0, 3).map((l) => (
                    <span
                      key={l}
                      className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary"
                    >
                      {l}
                    </span>
                  ))}
                  {((activeCard.labels as string[]) ?? []).length > 3 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{((activeCard.labels as string[]) ?? []).length - 3}
                    </span>
                  )}
                </div>
              )}
              {(activeCard.assignees ?? []).length > 0 && (
                <div className="flex gap-0.5 mt-2">
                  {(activeCard.assignees ?? []).slice(0, 3).map((a: { id: string; name?: string | null; email?: string }) => (
                    <span
                      key={a.id}
                      className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] text-primary"
                    >
                      {((a as { name?: string; email?: string }).name || (a as { email?: string }).email)?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function findCard(board: BoardType, cardId: string): CardType | undefined {
  for (const col of board.columns) {
    const card = col.cards.find((c) => c.id === cardId);
    if (card) return card;
  }
  return undefined;
}

function resolveDropTarget(
  board: BoardType,
  overId: string,
  draggedCardId: string
): { columnId: string; order: number } | null {
  const column = board.columns.find((c) => c.id === overId);
  if (column) {
    return { columnId: column.id, order: column.cards.length };
  }
  for (const col of board.columns) {
    const index = col.cards.findIndex((c) => c.id === overId);
    if (index >= 0) {
      const card = col.cards[index];
      const isSameCard = card.id === draggedCardId;
      const order = isSameCard ? index : index + 1;
      return { columnId: col.id, order };
    }
  }
  return null;
}
