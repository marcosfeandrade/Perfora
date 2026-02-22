"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { KanbanBoard } from "@/features/agile/KanbanBoard";
import type { Board } from "@/lib/types";

export default function BoardKanbanPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  const boardId = params.boardId as string;
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.agile.boards
      .get(boardId)
      .then((b) => {
        if (!cancelled && b.workspaceId !== workspaceId) {
          router.replace("/");
          return;
        }
        if (!cancelled) setBoard(b);
      })
      .catch(() => {
        if (!cancelled) router.replace(`/workspace/${workspaceId}/planner/board`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [boardId, workspaceId, router]);

  if (loading || !board) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <p className="text-muted-foreground">Carregando board...</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      <KanbanBoard
        workspaceId={workspaceId}
        boardId={boardId}
        initialBoard={board}
      />
    </div>
  );
}
