import { redirect } from "next/navigation";
import { api } from "@/lib/api";

type LinkPageProps = {
  params: Promise<{ id: string; title: string }>;
};

export default async function NoteLinkPage({ params }: LinkPageProps) {
  const { id: workspaceId, title } = await params;
  const decodedTitle = decodeURIComponent(title);
  const notes = await api.notes.notes.search(workspaceId, decodedTitle);
  const exact = notes.find(
    (n) => n.title.toLowerCase() === decodedTitle.toLowerCase()
  );
  if (exact) {
    redirect(`/workspace/${workspaceId}/notes/${exact.id}`);
  }
  const created = await api.notes.notes.create(workspaceId, {
    title: decodedTitle,
  });
  redirect(`/workspace/${workspaceId}/notes/${created.id}`);
}
