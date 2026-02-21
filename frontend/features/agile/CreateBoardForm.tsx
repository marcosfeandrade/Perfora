"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateBoardForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    setLoading(true);
    try {
      const b = await api.agile.boards.create({
        name: name.trim(),
        workspaceId,
      });
      setName("");
      router.refresh();
      router.push(`/workspace/${workspaceId}/planner/board/${b.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar board");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap">
      <Input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do board"
        className="flex-1 min-w-[200px]"
        disabled={loading}
      />
      <Button type="submit" disabled={loading || !name.trim()}>
        {loading ? "Criando…" : "Criar board"}
      </Button>
      {error && (
        <p className="w-full text-sm text-destructive mt-1">{error}</p>
      )}
    </form>
  );
}
