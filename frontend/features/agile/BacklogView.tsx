"use client";

import { useState } from "react";
import Link from "next/link";
import type { Board, Card } from "@/lib/types";
import { Card as CardUI } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";

type BacklogViewProps = {
  workspaceId: string;
  backlogCards: Card[];
  boards: Board[];
};

function BacklogCardItem({ card }: { card: Card }) {
  const assignees = (card.assignees ?? []).map((a) => {
    const u = a as { user?: { id: string; email: string; name: string | null } };
    return u.user ?? a;
  });

  return (
    <CardUI className="p-3 hover:border-primary/50 hover:shadow-md transition-all">
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
    </CardUI>
  );
}

function BoardCardItem({
  card,
  workspaceId,
  boardId,
}: {
  card: Card;
  workspaceId: string;
  boardId: string;
}) {
  const assignees = (card.assignees ?? []).map((a) => {
    const u = a as { user?: { id: string; email: string; name: string | null } };
    return u.user ?? a;
  });

  return (
    <Link
      href={`/workspace/${workspaceId}/planner/board/${boardId}`}
      className="flex-1 min-w-0"
    >
      <CardUI className="p-3 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
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
      </CardUI>
    </Link>
  );
}

export function BacklogView({
  workspaceId,
  backlogCards,
  boards,
}: BacklogViewProps) {
  const [backlog, setBacklog] = useState(backlogCards);
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const refresh = async () => {
    const cards = await api.agile.backlog(workspaceId);
    setBacklog(cards);
  };

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

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Backlog</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Cards fora dos boards. Adicione aqui para organizar depois.
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
        {backlog.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum card no backlog. Adicione um acima.
          </p>
        ) : (
          <div className="space-y-2">
            {backlog.map((card) => (
              <BacklogCardItem key={card.id} card={card} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Cards por board</h2>
        {boards.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum board ainda. Crie um board na aba Board.
          </p>
        ) : (
          <div className="space-y-6">
            {boards.map((board) => {
              const allCards = (board.columns ?? []).flatMap((col) =>
                (col.cards ?? []).map((c) => ({ card: c, columnName: col.name }))
              );
              if (allCards.length === 0) return null;

              return (
                <div key={board.id}>
                  <Link
                    href={`/workspace/${workspaceId}/planner/board/${board.id}`}
                    className="text-sm font-medium text-primary hover:underline mb-2 block"
                  >
                    {board.name}
                  </Link>
                  <ScrollArea className="h-auto max-h-[320px]">
                    <div className="space-y-2 pr-4">
                      {allCards.map(({ card, columnName }) => (
                        <div key={card.id} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground shrink-0 w-24 truncate">
                            {columnName}
                          </span>
                          <BoardCardItem
                            card={card}
                            workspaceId={workspaceId}
                            boardId={board.id}
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
