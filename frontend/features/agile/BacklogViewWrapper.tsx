"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BacklogView } from "./BacklogView";
import type { Board, Card } from "@/lib/types";

export function BacklogViewWrapper({ workspaceId }: { workspaceId: string }) {
  const [backlogCards, setBacklogCards] = useState<Card[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [cards, boardsList] = await Promise.all([
        api.agile.backlog(workspaceId),
        api.agile.boards.listByWorkspace(workspaceId),
      ]);
      setBacklogCards(cards);
      setBoards(boardsList);
    } catch {
      setBacklogCards([]);
      setBoards([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando backlog...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <BacklogView
        workspaceId={workspaceId}
        backlogCards={backlogCards}
        boards={boards}
      />
    </div>
  );
}
