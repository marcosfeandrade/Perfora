"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import type { Board, Card, Column } from "@/lib/types";
import { Card as CardUI } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CardDetailModal } from "./CardDetailModal";
import { getPriorityDisplay } from "./priorityDisplay";
import {
  joinWorkspaceRoom,
  leaveWorkspaceRoom,
  onBoardUpdate,
  onBacklogUpdate,
} from "@/lib/websocket";

const CARD_PREFIX = "card-";
const COLUMN_PREFIX = "column-";
const BACKLOG_DROP_ID = "backlog-drop";

function cardDragId(id: string) {
  return `${CARD_PREFIX}${id}`;
}

function columnDropId(id: string) {
  return `${COLUMN_PREFIX}${id}`;
}

function parseDragId(id: string): { type: "card"; id: string } | null {
  if (id.startsWith(CARD_PREFIX)) return { type: "card", id: id.slice(CARD_PREFIX.length) };
  return null;
}

function parseDropId(id: string): { type: "column" | "backlog"; id: string | null } | null {
  if (id === BACKLOG_DROP_ID) return { type: "backlog", id: null };
  if (id.startsWith(COLUMN_PREFIX)) return { type: "column", id: id.slice(COLUMN_PREFIX.length) };
  return null;
}

function normalizeAssignees(assignees: Card["assignees"]) {
  return (assignees ?? []).map((a) => {
    const u = a as { user?: { id: string; email: string; name: string | null } };
    return u.user ?? a;
  });
}

function DraggableCard({
  card,
  workspaceId,
  boardId,
  isBacklog,
  skipClickRef,
  onCardClick,
}: {
  card: Card;
  workspaceId: string;
  boardId?: string;
  isBacklog: boolean;
  skipClickRef?: React.MutableRefObject<boolean>;
  onCardClick?: (card: Card) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: cardDragId(card.id),
    data: { card, isBacklog },
  });

  const assignees = normalizeAssignees(card.assignees);
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const content = (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-medium text-sm truncate">{card.title}</p>
        {card.code && (
          <p className="text-muted-foreground text-xs mt-0.5">{card.code}</p>
        )}
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {getPriorityDisplay(card.priority) && (
            <span
              title={getPriorityDisplay(card.priority)!.label}
              className="text-xs"
            >
              {getPriorityDisplay(card.priority)!.emoji}
            </span>
          )}
          {(card.labels as string[])?.length ? (
          <>
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
          </>
        ) : null}
        </div>
      </div>
      {assignees.length > 0 && (
        <div className="flex gap-0.5 shrink-0">
          {assignees.slice(0, 3).map((a) => (
            <span
              key={a.id}
              className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] text-primary"
            >
              {(a.name || a.email)?.[0]?.toUpperCase() ?? "?"}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (skipClickRef?.current) {
        e.preventDefault();
        e.stopPropagation();
        skipClickRef.current = false;
        return;
      }
      onCardClick?.(card);
    },
    [card, onCardClick, skipClickRef]
  );

  const cardEl = (
    <CardUI
      ref={setNodeRef}
      style={isDragging ? { visibility: "hidden" } : style}
      {...listeners}
      {...attributes}
      onClick={onCardClick ? handleClick : undefined}
      className={cn(
        "p-3 cursor-grab active:cursor-grabbing transition-all",
        onCardClick && "cursor-pointer"
      )}
    >
      {content}
    </CardUI>
  );

  return cardEl;
}

function BoardNameLink({
  workspaceId,
  boardId,
  name,
  skipClickRef,
}: {
  workspaceId: string;
  boardId: string;
  name: string;
  skipClickRef?: React.MutableRefObject<boolean>;
}) {
  const router = useRouter();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (skipClickRef?.current) {
        e.preventDefault();
        e.stopPropagation();
        skipClickRef.current = false;
        return;
      }
      router.push(`/workspace/${workspaceId}/planner/board/${boardId}`);
    },
    [workspaceId, boardId, router, skipClickRef]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-sm font-medium text-primary hover:underline mb-3 block text-left"
    >
      {name}
    </button>
  );
}

function DroppableBacklog({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: BACKLOG_DROP_ID,
    data: { type: "backlog" },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border-2 border-dashed p-4 min-h-[120px] transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border"
      )}
    >
      <p className="text-xs font-medium text-muted-foreground mb-2">Backlog</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DroppableColumn({
  column,
  workspaceId,
  boardId,
  children,
  skipClickRef,
}: {
  column: Column;
  workspaceId: string;
  boardId: string;
  children: React.ReactNode;
  skipClickRef?: React.MutableRefObject<boolean>;
}) {
  const router = useRouter();
  const { setNodeRef, isOver } = useDroppable({
    id: columnDropId(column.id),
    data: { column },
  });

  const handleColumnNameClick = useCallback(
    (e: React.MouseEvent) => {
      if (skipClickRef?.current) {
        e.preventDefault();
        e.stopPropagation();
        skipClickRef.current = false;
        return;
      }
      router.push(`/workspace/${workspaceId}/planner/board/${boardId}`);
    },
    [workspaceId, boardId, router, skipClickRef]
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border-2 border-dashed p-3 min-h-[80px] transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border"
      )}
    >
      <button
        type="button"
        onClick={handleColumnNameClick}
        className="text-xs font-medium text-muted-foreground hover:text-primary block mb-2 text-left w-full"
      >
        {column.name}
      </button>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function findCardInBoards(boards: Board[], cardId: string): Card | null {
  for (const board of boards) {
    for (const col of board.columns ?? []) {
      const card = (col.cards ?? []).find((c) => c.id === cardId);
      if (card) return card;
    }
  }
  return null;
}

export function BacklogView({
  workspaceId,
  backlogCards,
  boards,
}: {
  workspaceId: string;
  backlogCards: Card[];
  boards: Board[];
}) {
  const [backlog, setBacklog] = useState(backlogCards);
  const [boardsState, setBoardsState] = useState(boards);
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [allUsers, setAllUsers] = useState<{ id: string; email: string; name: string | null }[]>([]);

  const skipClickRef = useRef(false);

  useEffect(() => {
    api.auth.users().then(setAllUsers).catch(() => setAllUsers([]));
  }, []);

  const refresh = useCallback(async () => {
    const [cards, boardsList] = await Promise.all([
      api.agile.backlog(workspaceId),
      api.agile.boards.listByWorkspace(workspaceId),
    ]);
    setBacklog(cards);
    setBoardsState(boardsList);
  }, [workspaceId]);

  useEffect(() => {
    joinWorkspaceRoom(workspaceId);
    const unsubBacklog = onBacklogUpdate(refresh);
    const unsubBoard = onBoardUpdate(() => refresh());
    return () => {
      unsubBacklog();
      unsubBoard();
      leaveWorkspaceRoom(workspaceId);
    };
  }, [workspaceId, refresh]);

  const handleAddBacklogCard = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setIsAdding(true);
    try {
      await api.agile.cards.create({
        title,
        order: backlog.length,
        workspaceId,
      });
      setNewTitle("");
      await refresh();
    } finally {
      setIsAdding(false);
    }
  };

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const drag = parseDragId(String(event.active.id));
      if (!drag) return;
      const cardFromBacklog = backlog.find((c) => c.id === drag.id);
      const cardFromBoard = findCardInBoards(boardsState, drag.id);
      setActiveCard(cardFromBacklog ?? cardFromBoard ?? null);
    },
    [backlog, boardsState]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      skipClickRef.current = true;

      const { active, over } = event;
      if (!over) {
        setActiveCard(null);
        setTimeout(() => { skipClickRef.current = false; }, 150);
        return;
      }

      const drag = parseDragId(String(active.id));
      const drop = parseDropId(String(over.id));
      if (!drag || !drop) {
        setActiveCard(null);
        setTimeout(() => { skipClickRef.current = false; }, 150);
        return;
      }

      const cardFromBacklog = backlog.find((c) => c.id === drag.id);
      const cardFromBoard = findCardInBoards(boardsState, drag.id);
      const card = cardFromBacklog ?? cardFromBoard;
      if (!card) {
        setActiveCard(null);
        setTimeout(() => { skipClickRef.current = false; }, 150);
        return;
      }

      try {
        if (drop.type === "backlog") {
          const order = backlog.length;
          await api.agile.cards.move(card.id, { targetColumnId: null, order });
        } else if (drop.type === "column" && drop.id) {
          const column = boardsState
            .flatMap((b) => b.columns ?? [])
            .find((c) => c.id === drop.id);
          const order = column ? (column.cards?.length ?? 0) : 0;
          await api.agile.cards.move(card.id, {
            targetColumnId: drop.id,
            order,
          });
        }
        await refresh();
      } catch {
        //
      } finally {
        setActiveCard(null);
      }
      setTimeout(() => { skipClickRef.current = false; }, 150);
    },
    [backlog, boardsState, refresh]
  );

  const handleDragCancel = useCallback(() => {
    setActiveCard(null);
  }, []);

  const handleCardClick = useCallback((card: Card) => {
    setEditingCard(card);
  }, []);

  const handleTitleChange = useCallback(
    async (cardId: string, title: string) => {
      await api.agile.cards.update(cardId, { title });
      await refresh();
      setEditingCard((prev) => (prev?.id === cardId ? { ...prev, title } : prev));
    },
    [refresh]
  );

  const handleDescriptionChange = useCallback(
    async (cardId: string, description: string) => {
      await api.agile.cards.update(cardId, { description });
      await refresh();
      setEditingCard((prev) => (prev?.id === cardId ? { ...prev, description } : prev));
    },
    [refresh]
  );

  const handleAssigneesChange = useCallback(
    async (cardId: string, assigneeIds: string[]) => {
      const updated = await api.agile.cards.update(cardId, { assigneeIds });
      const raw = (updated as { assignees?: { user?: { id: string; email: string; name: string | null } }[] }).assignees ?? [];
      const assignees = raw.map((a) => ("user" in a && a.user ? a.user : a)) as { id: string; email: string; name: string | null }[];
      await refresh();
      setEditingCard((prev) => (prev?.id === cardId ? { ...prev, assignees } : prev));
    },
    [refresh]
  );

  const handleLabelsChange = useCallback(
    async (cardId: string, labels: string[]) => {
      await api.agile.cards.update(cardId, { labels });
      await refresh();
      setEditingCard((prev) => (prev?.id === cardId ? { ...prev, labels } : prev));
    },
    [refresh]
  );

  const handleStartDateChange = useCallback(
    async (cardId: string, date: string | null) => {
      await api.agile.cards.update(cardId, { startDate: date ?? undefined });
      await refresh();
      setEditingCard((prev) => (prev?.id === cardId ? { ...prev, startDate: date } : prev));
    },
    [refresh]
  );

  const handleDueDateChange = useCallback(
    async (cardId: string, date: string | null) => {
      await api.agile.cards.update(cardId, { dueDate: date ?? undefined });
      await refresh();
      setEditingCard((prev) => (prev?.id === cardId ? { ...prev, dueDate: date } : prev));
    },
    [refresh]
  );

  const handlePriorityChange = useCallback(
    async (cardId: string, priority: string | null) => {
      await api.agile.cards.update(cardId, { priority: priority ?? undefined });
      await refresh();
      setEditingCard((prev) => (prev?.id === cardId ? { ...prev, priority } : prev));
    },
    [refresh]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Backlog</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Arraste cards entre backlog e colunas dos boards. Mudanças em tempo real.
          </p>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Nova task no backlog..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddBacklogCard()}
              className="max-w-sm"
            />
            <Button
              onClick={handleAddBacklogCard}
              disabled={!newTitle.trim() || isAdding}
              size="icon"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <DroppableBacklog>
            {backlog.length === 0 ? (
              <p className="text-muted-foreground text-sm py-2">
                Nenhum card. Adicione um acima ou arraste daqui.
              </p>
            ) : (
              backlog.map((card) => (
                <DraggableCard
                  key={card.id}
                  card={card}
                  workspaceId={workspaceId}
                  isBacklog
                  skipClickRef={skipClickRef}
                  onCardClick={handleCardClick}
                />
              ))
            )}
          </DroppableBacklog>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Cards por board</h2>
          {boardsState.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum board ainda. Crie um board na aba Board.
            </p>
          ) : (
            <div className="space-y-6">
              {boardsState.map((board) => (
                <div key={board.id}>
                  <BoardNameLink
                    workspaceId={workspaceId}
                    boardId={board.id}
                    name={board.name}
                    skipClickRef={skipClickRef}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(board.columns ?? []).map((column) => (
                      <DroppableColumn
                        key={column.id}
                        column={column}
                        workspaceId={workspaceId}
                        boardId={board.id}
                        skipClickRef={skipClickRef}
                      >
                        {(column.cards ?? []).map((card) => (
                          <DraggableCard
                            key={card.id}
                            card={card}
                            workspaceId={workspaceId}
                            boardId={board.id}
                            isBacklog={false}
                            skipClickRef={skipClickRef}
                            onCardClick={handleCardClick}
                          />
                        ))}
                      </DroppableColumn>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <CardUI className="p-3 cursor-grabbing shadow-xl w-56 opacity-95 border-2 border-primary">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium text-sm truncate">{activeCard.title}</p>
                {activeCard.code && (
                  <p className="text-muted-foreground text-xs mt-0.5">{activeCard.code}</p>
                )}
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {getPriorityDisplay(activeCard.priority) && (
                    <span
                      title={getPriorityDisplay(activeCard.priority)!.label}
                      className="text-xs"
                    >
                      {getPriorityDisplay(activeCard.priority)!.emoji}
                    </span>
                  )}
                  {((activeCard.labels as string[]) ?? []).length > 0 && (
                  <>
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
                  </>
                  )}
                </div>
              </div>
              {(activeCard.assignees ?? []).length > 0 && (
                <div className="flex gap-0.5 shrink-0">
                  {(activeCard.assignees ?? []).slice(0, 3).map((a) => {
                    const u = a as { user?: { id: string; email: string; name: string | null } };
                    const assignee = u.user ?? a;
                    return (
                      <span
                        key={assignee.id}
                        className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] text-primary"
                      >
                        {(assignee.name || assignee.email)?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </CardUI>
        ) : null}
      </DragOverlay>
      {editingCard && (
        <CardDetailModal
          card={editingCard}
          workspaceId={workspaceId}
          allUsers={allUsers}
          onClose={() => setEditingCard(null)}
          onTitleChange={handleTitleChange}
          onDescriptionChange={handleDescriptionChange}
          onAssigneesChange={handleAssigneesChange}
          onLabelsChange={handleLabelsChange}
          onStartDateChange={handleStartDateChange}
          onDueDateChange={handleDueDateChange}
          onPriorityChange={handlePriorityChange}
        />
      )}
    </DndContext>
  );
}
