"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <aside className="w-56 flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Workspaces
        </h2>
        <button
          type="button"
          onClick={onCreateClick}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all duration-200"
          title="Novo workspace"
          aria-label="Novo workspace"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <nav className="flex-1 p-2 overflow-y-auto">
        {workspaces.length === 0 ? (
          <p className="text-muted-foreground text-sm px-2 py-4">Nenhum workspace</p>
        ) : (
          <ul className="space-y-0.5">
            {workspaces.map((ws) => {
              const isActive = workspaceId === ws.id;
              return (
                <li key={ws.id}>
                  <Link
                    href={`/workspace/${ws.id}`}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-l-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground border-l-2 border-l-transparent"
                    )}
                  >
                    <LayoutDashboard className="size-4 shrink-0" />
                    <span className="truncate">{ws.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
