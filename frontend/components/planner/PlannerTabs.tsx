"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type PlannerTabsProps = {
  workspaceId: string;
};

const TABS = [
  { href: "/board", label: "Board" },
  { href: "/timeline", label: "Timeline" },
] as const;

export function PlannerTabs({ workspaceId }: PlannerTabsProps) {
  const pathname = usePathname();
  const basePath = `/workspace/${workspaceId}/planner`;

  return (
    <div className="border-b border-white/10 bg-surface/50 px-6">
      <nav className="flex gap-1">
        {TABS.map(({ href, label }) => {
          const fullPath = `${basePath}${href}`;
          const isActive = pathname === fullPath || pathname?.startsWith(`${fullPath}/`);

          return (
            <Link
              key={href}
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
