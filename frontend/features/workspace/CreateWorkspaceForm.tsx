"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function CreateWorkspaceForm() {
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
      const w = await api.workspaces.create({ name: name.trim() });
      setName("");
      router.refresh();
      router.push(`/workspace/${w.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar workspace");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do workspace"
        className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-surface border border-white/10 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Criando…" : "Criar workspace"}
      </button>
      {error && (
        <p className="w-full text-sm text-red-400 mt-1">{error}</p>
      )}
    </form>
  );
}
