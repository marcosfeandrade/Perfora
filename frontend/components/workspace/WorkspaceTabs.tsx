"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type WorkspaceTabsProps = {
  workspaceId: string;
  workspaceName: string;
};

const TABS = [
  { href: "", label: "Overview" },
  { href: "/planner", label: "Planner" },
  { href: "/notes", label: "Notes" },
] as const;

export function WorkspaceTabs({ workspaceId, workspaceName }: WorkspaceTabsProps) {
  const pathname = usePathname();
  const basePath = `/workspace/${workspaceId}`;

  return (
    <div className="border-b border-white/10 bg-surface">
      <div className="px-6 pt-4">
        <h1 className="text-xl font-semibold text-text">{workspaceName}</h1>
      </div>
      <nav className="flex gap-1 px-6 mt-4">
        {TABS.map(({ href, label }) => {
          const fullPath = href ? `${basePath}${href}` : basePath;
          const isActive =
            pathname === fullPath ||
            (href && pathname?.startsWith(fullPath));

          return (
            <Link
              key={href || "overview"}
              href={fullPath}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-text"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
