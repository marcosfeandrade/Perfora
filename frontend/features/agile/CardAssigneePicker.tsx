"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { CardAssignee } from "@/lib/types";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const assigneeIds = assignees.map((a) => a.id);

  useEffect(() => {
    if (open && buttonRef.current && typeof document !== "undefined") {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left });
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        open &&
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        !document.getElementById("card-assignee-dropdown")?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

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

  const dropdown = open && typeof document !== "undefined" && (
    <div
      id="card-assignee-dropdown"
      className="fixed z-[100] min-w-[200px] max-h-48 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg py-1"
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2 py-1 text-muted-foreground text-xs">Responsáveis</div>
      {allUsers.map((u) => {
        const isAssigned = assigneeIds.includes(u.id);
        return (
          <button
            key={u.id}
            type="button"
            onClick={() => toggleUser(u.id)}
            disabled={loading}
            className={cn(
              "w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors",
              isAssigned
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-accent"
            )}
          >
            <span className="size-4 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">
              {(u.name || u.email)?.[0]?.toUpperCase() ?? "?"}
            </span>
            {u.name || u.email}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200"
        title="Responsáveis"
      >
        <Users className="size-3.5" />
      </button>
      {dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}
