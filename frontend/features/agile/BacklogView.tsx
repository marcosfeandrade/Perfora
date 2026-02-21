"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
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
}: {
  card: Card;
  workspaceId: string;
  boardId?: string;
  isBacklog: boolean;
  skipClickRef?: React.MutableRefObject<boolean>;
}) {
  const router = useRouter();
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
      if (isBacklog) return;
      if (skipClickRef?.current) {
        e.preventDefault();
        e.stopPropagation();
        skipClickRef.current = false;
        return;
      }
      router.push(`/workspace/${workspaceId}/planner/board/${boardId}`);
    },
    [isBacklog, workspaceId, boardId, router, skipClickRef]
  );

  const cardEl = (
    <CardUI
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={!isBacklog ? handleClick : undefined}
      className={cn(
        "p-3 cursor-grab active:cursor-grabbing transition-all",
        isDragging && "opacity-50 shadow-lg",
        !isBacklog && "cursor-pointer"
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

  const skipClickRef = useRef(false);

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

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      skipClickRef.current = true;

      const { active, over } = event;
      if (!over) {
        setTimeout(() => { skipClickRef.current = false; }, 150);
        return;
      }

      const drag = parseDragId(String(active.id));
      const drop = parseDropId(String(over.id));
      if (!drag || !drop) {
        setTimeout(() => { skipClickRef.current = false; }, 150);
        return;
      }

      const cardFromBacklog = backlog.find((c) => c.id === drag.id);
      const cardFromBoard = findCardInBoards(boardsState, drag.id);
      const card = cardFromBacklog ?? cardFromBoard;
      if (!card) {
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
      }
      setTimeout(() => { skipClickRef.current = false; }, 150);
    },
    [backlog, boardsState, refresh]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
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
    </DndContext>
  );
}
