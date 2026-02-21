"use client";

import { useState } from "react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/sidebar/WorkspaceSidebar";
import { CreateWorkspaceModal } from "@/components/workspace/CreateWorkspaceModal";
import { useWorkspaces } from "@/contexts/WorkspaceContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { workspaces, createWorkspace } = useWorkspaces();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <WorkspaceHeader />
      <div className="flex flex-1 min-h-0">
        <WorkspaceSidebar
          workspaces={workspaces}
          onCreateClick={() => setModalOpen(true)}
        />
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
      <CreateWorkspaceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(name) => createWorkspace(name)}
      />
    </div>
  );
}
