"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Workspace = {
  id: string;
  name: string;
};

type WorkspaceSidebarProps = {
  workspaces: Workspace[];
  onCreateClick: () => void;
};

export function WorkspaceSidebar({ workspaces, onCreateClick }: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const workspaceId = pathname?.split("/workspace/")[1]?.split("/")[0];

  return (
    <aside className="w-56 flex-shrink-0 border-r border-white/10 bg-surface flex flex-col">
      <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
          Workspaces
        </h2>
        <button
          type="button"
          onClick={onCreateClick}
          className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-text transition-colors"
          title="Novo workspace"
          aria-label="Novo workspace"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 p-2 overflow-y-auto">
        {workspaces.length === 0 ? (
          <p className="text-muted text-sm px-2 py-4">Nenhum workspace</p>
        ) : (
          <ul className="space-y-0.5">
            {workspaces.map((ws) => (
              <li key={ws.id}>
                <Link
                  href={`/workspace/${ws.id}`}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    workspaceId === ws.id
                      ? "bg-primary/20 text-primary"
                      : "text-muted hover:bg-white/5 hover:text-text"
                  }`}
                >
                  {ws.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
