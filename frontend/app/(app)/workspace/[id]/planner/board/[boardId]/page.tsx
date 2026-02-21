import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { KanbanBoard } from "@/features/agile/KanbanBoard";

type BoardPageProps = {
  params: Promise<{ id: string; boardId: string }>;
};

export default async function BoardKanbanPage({ params }: BoardPageProps) {
  const { id: workspaceId, boardId } = await params;
  let board;

  try {
    board = await api.agile.boards.get(boardId);
  } catch {
    notFound();
  }

  if (board.workspaceId !== workspaceId) notFound();

  return (
    <div className="h-full min-h-0 flex flex-col">
      <KanbanBoard
        workspaceId={workspaceId}
        boardId={boardId}
        initialBoard={board}
      />
    </div>
  );
}
