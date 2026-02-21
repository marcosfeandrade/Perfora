import { api } from "@/lib/api";
import { WorkspaceSettingsClient } from "@/features/workspace/WorkspaceSettingsClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkspaceSettingsPage({ params }: PageProps) {
  const { id } = await params;
  const workspace = await api.workspaces.get(id);

  return (
    <WorkspaceSettingsClient
      workspaceId={workspace.id}
      initialName={workspace.name}
      initialPlannerTaskPrefix={workspace.plannerTaskPrefix ?? ""}
    />
  );
}
