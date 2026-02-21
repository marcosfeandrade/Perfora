import Link from "next/link";
import { api } from "@/lib/api";
import { CreateWorkspaceForm } from "@/features/workspace/CreateWorkspaceForm";

export default async function DashboardPage() {
  let workspaces: { id: string; name: string }[] = [];
  try {
    workspaces = await api.workspaces.list();
  } catch {
    workspaces = [];
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-text mb-6">
        Seus workspaces
      </h1>
      <CreateWorkspaceForm />
      <ul className="mt-6 space-y-2">
        {workspaces.map((w) => (
          <li key={w.id}>
            <Link
              href={`/workspace/${w.id}`}
              className="block p-3 rounded-lg bg-surface hover:bg-white/5 text-text transition-colors"
            >
              {w.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
