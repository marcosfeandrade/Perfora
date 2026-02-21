import Link from "next/link";
import { api } from "@/lib/api";
import { CreateBoardForm } from "@/features/agile/CreateBoardForm";
import { Card, CardContent } from "@/components/ui/card";

type BoardListPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BoardListPage({ params }: BoardListPageProps) {
  const { id: workspaceId } = await params;
  let boards: { id: string; name: string; workspaceId: string }[] = [];

  try {
    boards = await api.agile.boards.listByWorkspace(workspaceId);
  } catch {
    boards = [];
  }

  return (
    <div className="p-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">Boards</h2>
      <CreateBoardForm workspaceId={workspaceId} />
      {boards.length === 0 ? (
        <p className="text-muted-foreground mt-6">Nenhum board ainda. Crie um acima.</p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => (
            <li key={b.id}>
              <Link href={`/workspace/${workspaceId}/planner/board/${b.id}`}>
                <Card className="p-4 transition-all duration-200 hover:shadow-md hover:border-primary/50">
                  <CardContent className="p-0 text-foreground">
                    {b.name}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
