"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Workspace, Board } from "@/lib/types";

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [boardsByWorkspace, setBoardsByWorkspace] = useState<
    Record<string, Board[]>
  >({});
  const workspaceIdFromPath = pathname.match(/^\/workspace\/([^/]+)/)?.[1];
  const [expandedWorkspace, setExpandedWorkspace] = useState<string | null>(
    workspaceIdFromPath ?? null
  );

  useEffect(() => {
    if (workspaceIdFromPath) setExpandedWorkspace((prev) => prev ?? workspaceIdFromPath);
  }, [workspaceIdFromPath]);

  useEffect(() => {
    api.workspaces.list().then(setWorkspaces).catch(() => setWorkspaces([]));
  }, []);

  useEffect(() => {
    if (!expandedWorkspace) return;
    api.agile.boards
      .listByWorkspace(expandedWorkspace)
      .then((boards) =>
        setBoardsByWorkspace((prev) => ({
          ...prev,
          [expandedWorkspace]: boards,
        }))
      )
      .catch(() => {});
  }, [expandedWorkspace]);

  const workspaceId = pathname.match(/^\/workspace\/([^/]+)/)?.[1];
  const boardId = pathname.match(/\/board\/([^/]+)/)?.[1];

  return (
    <aside className="w-64 min-h-screen bg-surface border-r border-white/10 flex flex-col">
      <div className="p-4 border-b border-white/10">
        <Link href="/" className="text-xl font-semibold text-text block">
          Perfora
        </Link>
        {user && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-muted text-sm truncate" title={user.email}>
              {user.name || user.email}
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-xs text-muted hover:text-text px-2 py-1 rounded hover:bg-white/5"
            >
              Sair
            </button>
          </div>
        )}
      </div>
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="text-muted text-xs uppercase tracking-wider px-2 py-1">
          Workspaces
        </div>
        {workspaces.map((w) => (
          <div key={w.id} className="mb-1">
            <button
              type="button"
              onClick={() =>
                setExpandedWorkspace((id) => (id === w.id ? null : w.id))
              }
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-text hover:bg-white/5 transition-colors"
            >
              <Link
                href={`/workspace/${w.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 truncate"
              >
                {w.name}
              </Link>
              <span
                className={`text-muted transition-transform ${
                  expandedWorkspace === w.id ? "rotate-90" : ""
                }`}
              >
                ›
              </span>
            </button>
            {expandedWorkspace === w.id && (
              <div className="ml-3 mt-1 space-y-0.5">
                {(boardsByWorkspace[w.id] ?? []).map((b) => (
                  <Link
                    key={b.id}
                    href={`/workspace/${w.id}/board/${b.id}`}
                    className={`block px-3 py-1.5 rounded-lg text-sm truncate transition-colors ${
                      boardId === b.id && workspaceId === w.id
                        ? "bg-primary/20 text-accent"
                        : "text-muted hover:text-text hover:bg-white/5"
                    }`}
                  >
                    {b.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
