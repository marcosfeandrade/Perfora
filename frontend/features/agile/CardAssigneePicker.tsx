"use client";

import { useState } from "react";
import type { CardAssignee } from "@/lib/types";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CardAssigneePickerProps = {
  cardId: string;
  assignees: CardAssignee[];
  allUsers: { id: string; email: string; name: string | null }[];
  onAssigneesChange: (cardId: string, assigneeIds: string[]) => Promise<void>;
};

export function CardAssigneePicker({
  cardId,
  assignees,
  allUsers,
  onAssigneesChange,
}: CardAssigneePickerProps) {
  const [loading, setLoading] = useState(false);

  const assigneeIds = assignees.map((a) => a.id);

  async function toggleUser(userId: string) {
    setLoading(true);
    const newIds = assigneeIds.includes(userId)
      ? assigneeIds.filter((id) => id !== userId)
      : [...assigneeIds, userId];
    try {
      await onAssigneesChange(cardId, newIds);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200"
          title="Responsáveis"
        >
          <Users className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-[100] min-w-[200px] max-h-48 overflow-y-auto">
        {allUsers.map((u) => {
          const isAssigned = assigneeIds.includes(u.id);
          return (
            <DropdownMenuItem
              key={u.id}
              onSelect={(e) => {
                e.preventDefault();
                toggleUser(u.id);
              }}
              disabled={loading}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                isAssigned && "bg-primary/10 text-primary"
              )}
            >
              <span className="size-4 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary shrink-0">
                {(u.name || u.email)?.[0]?.toUpperCase() ?? "?"}
              </span>
              {u.name || u.email}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
