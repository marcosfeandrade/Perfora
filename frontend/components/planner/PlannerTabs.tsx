"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PlannerTabsProps = {
  workspaceId: string;
};

const TABS = [
  { href: "/board", label: "Board" },
  { href: "/backlog", label: "Backlog" },
  { href: "/timeline", label: "Timeline" },
] as const;

export function PlannerTabs({ workspaceId }: PlannerTabsProps) {
  const pathname = usePathname();
  const basePath = `/workspace/${workspaceId}/planner`;

  const activeTab = TABS.find(({ href }) => {
    const fullPath = `${basePath}${href}`;
    return pathname === fullPath || pathname?.startsWith(`${fullPath}/`);
  })?.href ?? "/board";

  return (
    <div className="border-b border-border bg-card/50 px-6">
      <Tabs value={activeTab}>
        <TabsList className="bg-transparent p-0 h-auto gap-1 border-0">
          {TABS.map(({ href, label }) => {
            const fullPath = `${basePath}${href}`;

            return (
              <TabsTrigger key={href} value={href} asChild>
                <Link href={fullPath}>{label}</Link>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
