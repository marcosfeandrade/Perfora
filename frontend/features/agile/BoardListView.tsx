"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { CreateBoardForm } from "./CreateBoardForm";
import { Card, CardContent } from "@/components/ui/card";
import {
  joinWorkspaceRoom,
  leaveWorkspaceRoom,
  onBoardsListUpdate,
} from "@/lib/websocket";

type BoardItem = { id: string; name: string; workspaceId: string };

export function BoardListView({ workspaceId }: { workspaceId: string }) {
  const [boards, setBoards] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBoards = useCallback(async () => {
    try {
      const list = await api.agile.boards.listByWorkspace(workspaceId);
      setBoards(list);
    } catch {
      setBoards([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    joinWorkspaceRoom(workspaceId);
    const unsub = onBoardsListUpdate(loadBoards);
    return () => {
      unsub();
      leaveWorkspaceRoom(workspaceId);
    };
  }, [workspaceId, loadBoards]);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Carregando boards...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">Boards</h2>
      <CreateBoardForm workspaceId={workspaceId} />
      {boards.length === 0 ? (
        <p className="text-muted-foreground mt-6">
          Nenhum board ainda. Crie um acima.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => (
            <li key={b.id}>
              <Link href={`/workspace/${workspaceId}/planner/board/${b.id}`}>
                <Card className="p-4 transition-all duration-200 hover:shadow-md hover:border-primary/50">
                  <CardContent className="p-0 text-foreground">
                    {b.name}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
