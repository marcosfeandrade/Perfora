import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { CreateBoardForm } from "@/features/agile/CreateBoardForm";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  let boards: { id: string; name: string; workspaceId: string }[] = [];
  try {
    boards = await api.agile.boards.listByWorkspace(workspaceId);
  } catch {
    notFound();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-text mb-6">Boards</h1>
      <CreateBoardForm workspaceId={workspaceId} />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((b) => (
          <li key={b.id}>
            <Link
              href={`/workspace/${workspaceId}/board/${b.id}`}
              className="block p-4 rounded-lg bg-surface hover:bg-white/5 text-text border border-white/10 transition-colors"
            >
              {b.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
