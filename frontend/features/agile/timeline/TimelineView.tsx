"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Board, Card } from "@/lib/types";
import {
  joinWorkspaceRoom,
  leaveWorkspaceRoom,
  onBoardUpdate,
  onBacklogUpdate,
} from "@/lib/websocket";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineGrid } from "./TimelineGrid";
import { CardDetailModal } from "../CardDetailModal";
import { generateDateRange, type TimelineMode } from "./utils";

type CardWithBoard = Card & { boardName?: string; columnName?: string };

type TimelineViewProps = {
  workspaceId: string;
  boardId?: string | null;
  boardName?: string;
};

export function TimelineView({
  workspaceId,
  boardId,
  boardName = "Timeline",
}: TimelineViewProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [backlogCards, setBacklogCards] = useState<Card[]>([]);
  const [allUsers, setAllUsers] = useState<
    { id: string; email: string; name: string | null }[]
  >([]);
  const [mode, setMode] = useState<TimelineMode>("week");
  const [centerDate, setCenterDate] = useState(() => new Date());
  const [filterAssigneeIds, setFilterAssigneeIds] = useState<string[]>([]);
  const [filterLabels, setFilterLabels] = useState<string[]>([]);
  const [showAllTasks, setShowAllTasks] = useState(true);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(
    boardId ?? null
  );
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);

  const dayWidth = mode === "week" ? 48 : 32;

  const refresh = useCallback(async () => {
    try {
      const [boardsData, backlogData, usersData] = await Promise.all([
        api.agile.boards.listByWorkspace(workspaceId),
        api.agile.backlog(workspaceId),
        api.auth.users(),
      ]);
      setBoards(boardsData);
      setBacklogCards(backlogData);
      setAllUsers(usersData);
    } catch {
      setBoards([]);
      setBacklogCards([]);
      setAllUsers([]);
    }
  }, [workspaceId]);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

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

  const cardsWithBoard: CardWithBoard[] = [];
  for (const board of boards) {
    const showBoard = showAllTasks || board.id === selectedBoardId;
    if (!showBoard) continue;
    for (const col of board.columns ?? []) {
      for (const card of col.cards ?? []) {
        if (card.startDate || card.dueDate) {
          cardsWithBoard.push({
            ...card,
            boardName: board.name,
            columnName: col.name,
          });
        }
      }
    }
  }
  if (showAllTasks) {
    for (const card of backlogCards) {
      if (card.startDate || card.dueDate) {
        cardsWithBoard.push({ ...card, boardName: "Backlog" });
      }
    }
  }

  const allLabels = Array.from(
    new Set(
      cardsWithBoard.flatMap((c) => (c.labels as string[]) ?? [])
    )
  ).sort();

  const filteredCards = cardsWithBoard.filter((card) => {
    if (filterAssigneeIds.length > 0) {
      const assigneeIds = (card.assignees ?? []).map((a) => {
        const u = a as { user?: { id: string } };
        return u.user?.id ?? (a as { id: string }).id;
      });
      if (!filterAssigneeIds.some((id) => assigneeIds.includes(id)))
        return false;
    }
    if (filterLabels.length > 0) {
      const cardLabels = (card.labels as string[]) ?? [];
      if (!filterLabels.some((l) => cardLabels.includes(l))) return false;
    }
    return true;
  });

  const updateCardInState = useCallback(
    (cardId: string, updater: (card: Card) => Card) => {
      setBoards((prev) =>
        prev.map((b) => ({
          ...b,
          columns: (b.columns ?? []).map((col) => ({
            ...col,
            cards: (col.cards ?? []).map((c) =>
              c.id === cardId ? updater(c) : c
            ),
          })),
        }))
      );
      setBacklogCards((prev) =>
        prev.map((c) => (c.id === cardId ? updater(c) : c))
      );
    },
    []
  );

  const handleDatesChange = useCallback(
    async (cardId: string, startDate: Date, dueDate: Date) => {
      const startStr = startDate.toISOString().slice(0, 10);
      const dueStr = dueDate.toISOString().slice(0, 10);
      updateCardInState(cardId, (c) => ({
        ...c,
        startDate: startStr,
        dueDate: dueStr,
      }));
      try {
        await api.agile.cards.update(cardId, {
          startDate: startStr,
          dueDate: dueStr,
        });
      } catch {
        refresh();
      }
    },
    [updateCardInState, refresh]
  );

  const handleAssigneesChange = useCallback(
    async (cardId: string, assigneeIds: string[]) => {
      try {
        const updated = await api.agile.cards.update(cardId, { assigneeIds });
        const raw =
          (updated as {
            assignees?: { user?: { id: string; email: string; name: string | null } }[];
          }).assignees ?? [];
        const assignees = raw.map((a) =>
          "user" in a && a.user ? a.user : a
        ) as { id: string; email: string; name: string | null }[];
        updateCardInState(cardId, (c) => ({ ...c, assignees }));
        setEditingCard((prev) =>
          prev?.id === cardId ? { ...prev, assignees } : prev
        );
      } catch {
        await refresh();
      }
    },
    [updateCardInState, refresh]
  );

  const handleLabelsChange = useCallback(
    async (cardId: string, labels: string[]) => {
      try {
        await api.agile.cards.update(cardId, { labels });
        updateCardInState(cardId, (c) => ({ ...c, labels }));
        setEditingCard((prev) =>
          prev?.id === cardId ? { ...prev, labels } : prev
        );
      } catch {
        await refresh();
      }
    },
    [updateCardInState, refresh]
  );

  const handleStartDateChange = useCallback(
    async (cardId: string, date: string | null) => {
      updateCardInState(cardId, (c) => ({
        ...c,
        startDate: date ?? undefined,
      }));
      try {
        await api.agile.cards.update(cardId, {
          startDate: date ?? undefined,
        });
      } catch {
        await refresh();
      }
    },
    [updateCardInState, refresh]
  );

  const handleDueDateChange = useCallback(
    async (cardId: string, date: string | null) => {
      updateCardInState(cardId, (c) => ({
        ...c,
        dueDate: date ?? undefined,
      }));
      try {
        await api.agile.cards.update(cardId, { dueDate: date ?? undefined });
      } catch {
        await refresh();
      }
    },
    [updateCardInState, refresh]
  );

  const handleTitleChange = useCallback(
    async (cardId: string, title: string) => {
      try {
        await api.agile.cards.update(cardId, { title });
        await refresh();
      } catch {
        await refresh();
      }
    },
    [refresh]
  );

  const handleDescriptionChange = useCallback(
    async (cardId: string, description: string) => {
      try {
        await api.agile.cards.update(cardId, { description });
        await refresh();
      } catch {
        await refresh();
      }
    },
    [refresh]
  );

  const handlePriorityChange = useCallback(
    async (cardId: string, priority: string | null) => {
      try {
        await api.agile.cards.update(cardId, {
          priority: priority ?? undefined,
        });
        updateCardInState(cardId, (c) => ({ ...c, priority }));
        setEditingCard((prev) =>
          prev?.id === cardId ? { ...prev, priority } : prev
        );
      } catch {
        await refresh();
      }
    },
    [updateCardInState, refresh]
  );

  const selectedBoard = boards.find((b) => b.id === selectedBoardId);
  const title =
    !showAllTasks && selectedBoard
      ? selectedBoard.name
      : "Timeline";

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TimelineHeader
        title={title}
        mode={mode}
        onModeChange={setMode}
        centerDate={centerDate}
        onCenterDateChange={setCenterDate}
        filterAssigneeIds={filterAssigneeIds}
        filterLabelIds={filterLabels}
        allUsers={allUsers}
        allLabels={allLabels}
        boards={boards.map((b) => ({ id: b.id, name: b.name }))}
        onFilterAssigneesChange={setFilterAssigneeIds}
        onFilterLabelsChange={setFilterLabels}
        showAllTasks={showAllTasks}
        onShowAllTasksChange={setShowAllTasks}
        selectedBoardId={selectedBoardId}
        onSelectedBoardIdChange={setSelectedBoardId}
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        <TimelineGrid
          cards={filteredCards}
          mode={mode}
          centerDate={centerDate}
          dayWidth={dayWidth}
          onDatesChange={handleDatesChange}
          onCardClick={setEditingCard}
        />
      </div>
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
    </div>
  );
}
