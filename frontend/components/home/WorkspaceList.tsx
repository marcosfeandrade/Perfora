"use client";

import { useState } from "react";
import Link from "next/link";
import { useWorkspaces } from "@/contexts/WorkspaceContext";
import { CreateWorkspaceModal } from "@/components/workspace/CreateWorkspaceModal";

export function WorkspaceList() {
  const { workspaces, createWorkspace } = useWorkspaces();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-text">
          Seus workspaces
        </h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          Novo workspace
        </button>
      </div>
      {workspaces.length === 0 ? (
        <div className="p-12 rounded-xl bg-surface border border-white/10 border-dashed text-center">
          <p className="text-muted mb-4">Nenhum workspace ainda.</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Criar primeiro workspace
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/workspace/${ws.id}`}
              className="block p-6 rounded-xl bg-surface border border-white/10 hover:border-primary/50 transition-colors"
            >
              <h2 className="font-medium text-text">{ws.name}</h2>
              <p className="text-sm text-muted mt-1">Abrir workspace</p>
            </Link>
          ))}
        </div>
      )}
      <CreateWorkspaceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(name) => createWorkspace(name)}
      />
    </div>
  );
}
