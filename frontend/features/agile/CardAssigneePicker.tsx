"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import type { CardAssignee } from "@/lib/types";

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

  useLayoutEffect(() => {
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
      className="fixed z-[100] min-w-[200px] max-h-48 overflow-y-auto rounded-lg bg-surface border border-white/10 shadow-xl py-1"
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2 py-1 text-muted text-xs">Responsáveis</div>
      {allUsers.map((u) => {
        const isAssigned = assigneeIds.includes(u.id);
        return (
          <button
            key={u.id}
            type="button"
            onClick={() => toggleUser(u.id)}
            disabled={loading}
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/10 ${
              isAssigned ? "bg-primary/20 text-accent" : "text-text"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-primary/30 flex items-center justify-center text-xs">
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
        className="p-1 rounded hover:bg-white/10 text-muted hover:text-text transition-colors"
        title="Responsáveis"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </button>
      {dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}
