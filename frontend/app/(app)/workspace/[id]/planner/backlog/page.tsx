import { api } from "@/lib/api";
import { BacklogView } from "@/features/agile/BacklogView";

type BacklogPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BacklogPage({ params }: BacklogPageProps) {
  const { id: workspaceId } = await params;
  let backlogCards: Awaited<ReturnType<typeof api.agile.backlog>> = [];
  let boards: Awaited<ReturnType<typeof api.agile.boards.listByWorkspace>> = [];

  try {
    [backlogCards, boards] = await Promise.all([
      api.agile.backlog(workspaceId),
      api.agile.boards.listByWorkspace(workspaceId),
    ]);
  } catch {
    backlogCards = [];
    boards = [];
  }

  return (
    <div className="p-6">
      <BacklogView
        workspaceId={workspaceId}
        backlogCards={backlogCards}
        boards={boards}
      />
    </div>
  );
}
