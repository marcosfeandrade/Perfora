"use client";

import { useState } from "react";

type CreateCardFormProps = {
  columnId: string;
  onSubmit: (title: string) => void | Promise<unknown>;
};

export function CreateCardForm({ onSubmit }: CreateCardFormProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSubmit(title.trim());
      setTitle("");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-white/20 py-2 text-muted hover:text-text hover:border-primary/50 transition-colors text-sm"
      >
        + Card
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título do card"
        autoFocus
        className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-text placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        disabled={loading}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "…" : "Adicionar"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setTitle(""); }}
          className="px-3 py-1.5 rounded-lg text-muted hover:text-text text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
