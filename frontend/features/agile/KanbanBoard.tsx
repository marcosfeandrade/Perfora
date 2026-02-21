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
import type { Board as BoardType, Column, Card } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";
import { CreateColumnForm } from "./CreateColumnForm";
import { CreateCardForm } from "./CreateCardForm";

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
  const [activeCard, setActiveCard] = useState<Card | null>(null);
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
      const card = findCard(board, String(event.active.id));
      if (card) setActiveCard(card);
    },
    [board]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveCard(null);
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
      } catch {
        setBoard((prev) => ({ ...prev }));
      }
    },
    [board]
  );

  const handleAddColumn = useCallback(
    (name: string) => {
      const order = board.columns.length;
      return api.agile.columns
        .create({ name, order, boardId })
        .then((col) => {
          const newColumn = { ...col, cards: col.cards ?? [] };
          setBoard((prev) => ({
            ...prev,
            columns: [...prev.columns, newColumn],
          }));
        });
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
      return api.agile.cards
        .create({ title, order, columnId })
        .then((card) => {
          setBoard((prev) => ({
            ...prev,
            columns: prev.columns.map((col) =>
              col.id === columnId
                ? { ...col, cards: [...(col.cards ?? []), card] }
                : col
            ),
          }));
        });
    },
    [board.columns]
  );

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-text">{board.name}</h1>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
          {board.columns.map((col, index) => (
            <KanbanColumn
              key={col.id}
              column={{ ...col, wipLimit: col.wipLimit ?? null }}
              canMoveLeft={index > 0}
              canMoveRight={index < board.columns.length - 1}
              allUsers={allUsers}
              onAddCard={(title) => handleAddCard(col.id, title)}
              onAssigneesChange={handleAssigneesChange}
              onTitleChange={handleTitleChange}
              onDescriptionChange={handleDescriptionChange}
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
            <div className="rounded-lg bg-surface border-2 border-primary p-3 cursor-grabbing shadow-xl w-[272px] opacity-95">
              <p className="text-text font-medium text-sm">{activeCard.title}</p>
              {activeCard.description ? (
                <p className="text-muted text-xs mt-1 line-clamp-2 whitespace-pre-line break-words">
                  {activeCard.description}
                </p>
              ) : null}
              {(activeCard.assignees ?? []).length > 0 && (
                <div className="flex gap-0.5 mt-2">
                  {(activeCard.assignees ?? []).slice(0, 3).map((a: { id: string; name?: string | null; email?: string }) => (
                    <span
                      key={a.id}
                      className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center text-[9px] text-accent"
                    >
                      {((a as { name?: string; email?: string }).name || (a as { email?: string }).email)?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function findCard(board: BoardType, cardId: string): Card | undefined {
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
