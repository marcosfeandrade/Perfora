"use client";

import { useState } from "react";
import Link from "next/link";
import { useWorkspaces } from "@/contexts/WorkspaceContext";
import { CreateWorkspaceModal } from "@/components/workspace/CreateWorkspaceModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function WorkspaceList() {
  const { workspaces, createWorkspace } = useWorkspaces();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Seus workspaces
        </h1>
        <Button onClick={() => setModalOpen(true)}>Novo workspace</Button>
      </div>
      {workspaces.length === 0 ? (
        <Card className="p-12 border-dashed">
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">Nenhum workspace ainda.</p>
            <Button onClick={() => setModalOpen(true)}>
              Criar primeiro workspace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link key={ws.id} href={`/workspace/${ws.id}`}>
              <Card className="p-6 transition-all duration-200 hover:shadow-md hover:border-primary/50">
                <CardContent className="p-0">
                  <h2 className="font-medium text-foreground">{ws.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Abrir workspace
                  </p>
                </CardContent>
              </Card>
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
