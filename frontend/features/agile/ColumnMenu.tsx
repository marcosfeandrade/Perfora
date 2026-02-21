"use client";

import { useState, useRef, useEffect } from "react";
import type { Column as ColumnType } from "@/lib/types";

type ColumnMenuProps = {
  column: ColumnType;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onSetWipLimit: (limit: number | null) => void;
  onDelete: () => void;
};

export function ColumnMenu({
  column,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
  onSetWipLimit,
  onDelete,
}: ColumnMenuProps) {
  const [open, setOpen] = useState(false);
  const [wipModalOpen, setWipModalOpen] = useState(false);
  const [wipValue, setWipValue] = useState(
    String(column.wipLimit ?? "")
  );
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setWipModalOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSetWipLimit() {
    const n = parseInt(wipValue, 10);
    if (!Number.isNaN(n) && n >= 1) {
      onSetWipLimit(n);
    } else if (wipValue.trim() === "") {
      onSetWipLimit(null);
    }
    setWipModalOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-1 rounded hover:bg-white/10 text-muted hover:text-text transition-colors"
        aria-label="Opções da coluna"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg bg-surface border border-white/10 shadow-xl py-1">
          <button
            type="button"
            onClick={() => {
              onMoveLeft();
              setOpen(false);
            }}
            disabled={!canMoveLeft}
            className="w-full px-3 py-2 text-left text-sm text-text hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>←</span>
            Mover para esquerda
          </button>
          <button
            type="button"
            onClick={() => {
              onMoveRight();
              setOpen(false);
            }}
            disabled={!canMoveRight}
            className="w-full px-3 py-2 text-left text-sm text-text hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>→</span>
            Mover para direita
          </button>
          <button
            type="button"
            onClick={() => {
              setWipModalOpen(true);
              setWipValue(String(column.wipLimit ?? ""));
            }}
            className="w-full px-3 py-2 text-left text-sm text-text hover:bg-white/10 flex items-center gap-2"
          >
            <span>#</span>
            Limite WIP
            {(column.wipLimit ?? null) != null && (
              <span className="text-muted text-xs">({column.wipLimit})</span>
            )}
          </button>
          <hr className="border-white/10 my-1" />
          <button
            type="button"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
          >
            <span>🗑</span>
            Deletar coluna
          </button>
        </div>
      )}
      {wipModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div
            className="bg-surface rounded-lg border border-white/10 p-4 w-80 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-text font-medium mb-2">Limite WIP</h3>
            <p className="text-muted text-sm mb-3">
              Número máximo de cards nesta coluna. Deixe vazio para sem limite.
            </p>
            <input
              type="number"
              min={1}
              value={wipValue}
              onChange={(e) => setWipValue(e.target.value)}
              placeholder="Ex: 3"
              className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-text mb-3"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setWipModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-muted hover:text-text"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSetWipLimit}
                className="px-3 py-1.5 rounded-lg bg-primary text-white font-medium"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
