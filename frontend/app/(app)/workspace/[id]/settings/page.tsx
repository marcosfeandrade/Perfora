"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { WorkspaceSettingsClient } from "@/features/workspace/WorkspaceSettingsClient";

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<{
    id: string;
    name: string;
    plannerTaskPrefix?: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.workspaces
      .get(id)
      .then((ws) => {
        if (!cancelled) {
          setWorkspace(ws);
        }
      })
      .catch(() => {
        if (!cancelled) {
          router.replace("/");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (loading || !workspace) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <WorkspaceSettingsClient
      workspaceId={workspace.id}
      initialName={workspace.name}
      initialPlannerTaskPrefix={workspace.plannerTaskPrefix ?? ""}
    />
  );
}
