"use client";

import { useState } from "react";

type CreateColumnFormProps = {
  onSubmit: (name: string) => void | Promise<unknown>;
};

export function CreateColumnForm({ onSubmit }: CreateColumnFormProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit(name.trim());
      setName("");
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
        className="w-full rounded-lg border-2 border-dashed border-white/20 p-4 text-muted hover:text-text hover:border-primary/50 transition-colors text-sm"
      >
        + Nova coluna
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-surface/80 border border-white/10 p-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome da coluna"
        autoFocus
        className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-text placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-2"
        disabled={loading}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "…" : "Criar"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setName(""); }}
          className="px-3 py-1.5 rounded-lg text-muted hover:text-text text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
