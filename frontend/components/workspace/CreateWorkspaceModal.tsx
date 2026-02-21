"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CreateWorkspaceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<{ id: string }>;
};

export function CreateWorkspaceModal({
  isOpen,
  onClose,
  onCreate,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const ws = await onCreate(trimmed);
      setName("");
      onClose();
      router.push(`/workspace/${ws.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar workspace");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md rounded-xl bg-surface border border-white/10 shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-text mb-4">
          Novo workspace
        </h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-muted mb-2">
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Meu Projeto"
            className="w-full rounded-lg bg-background border border-white/10 px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:border-primary/50"
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-400 mt-2">{error}</p>
          )}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-muted hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="px-4 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {loading ? "Criando…" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
