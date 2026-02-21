"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full border-dashed hover:border-primary/50 hover:text-primary hover:bg-primary/5"
      >
        + Card
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título do card"
        autoFocus
        disabled={loading}
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={loading || !title.trim()}
        >
          {loading ? "…" : "Adicionar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setOpen(false); setTitle(""); }}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
