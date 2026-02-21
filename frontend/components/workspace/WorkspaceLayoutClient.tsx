"use client";

import { useWorkspaces } from "@/contexts/WorkspaceContext";
import { WorkspaceTabs } from "@/components/workspace/WorkspaceTabs";

type WorkspaceLayoutClientProps = {
  workspaceId: string;
  children: React.ReactNode;
};

export function WorkspaceLayoutClient({
  workspaceId,
  children,
}: WorkspaceLayoutClientProps) {
  const { workspaces } = useWorkspaces();
  const workspace = workspaces.find((ws) => ws.id === workspaceId);

  if (!workspace) {
    return (
      <div className="p-8">
        <p className="text-muted">Workspace não encontrado.</p>
      </div>
    );
  }

  return (
    <>
      <WorkspaceTabs
        workspaceId={workspace.id}
        workspaceName={workspace.name}
      />
      <div className="flex-1 overflow-auto">{children}</div>
    </>
  );
}
