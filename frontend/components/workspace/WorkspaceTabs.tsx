"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const activeTab = TABS.find(({ href }) => {
    const fullPath = href ? `${basePath}${href}` : basePath;
    return pathname === fullPath || (href && pathname?.startsWith(fullPath));
  })?.href ?? "overview";

  return (
    <div className="border-b border-border bg-card">
      <div className="px-6 pt-4">
        <h1 className="text-xl font-semibold text-foreground">{workspaceName}</h1>
      </div>
      <Tabs value={activeTab} className="px-6 mt-4">
        <TabsList className="bg-transparent p-0 h-auto gap-1 border-0">
          {TABS.map(({ href, label }) => {
            const fullPath = href ? `${basePath}${href}` : basePath;
            const value = href || "overview";

            return (
              <TabsTrigger key={value} value={value} asChild>
                <Link
                  href={fullPath}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  {label}
                </Link>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
