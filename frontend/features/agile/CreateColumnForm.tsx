"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full h-full min-h-[120px] border-dashed hover:border-primary/50 hover:text-primary hover:bg-primary/5"
      >
        + Nova coluna
      </Button>
    );
  }

  return (
    <Card className="p-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da coluna"
          autoFocus
          disabled={loading}
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={loading || !name.trim()}>
            {loading ? "…" : "Criar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setOpen(false); setName(""); }}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
