import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { KanbanBoard } from "@/features/agile/KanbanBoard";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ workspaceId: string; boardId: string }>;
}) {
  const { workspaceId, boardId } = await params;
  let board;
  try {
    board = await api.agile.boards.get(boardId);
  } catch {
    notFound();
  }
  if (board.workspaceId !== workspaceId) notFound();

  return (
    <KanbanBoard
      workspaceId={workspaceId}
      boardId={boardId}
      initialBoard={board}
    />
  );
}
