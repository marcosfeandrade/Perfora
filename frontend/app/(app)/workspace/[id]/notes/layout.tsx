import { NotesLayoutClient } from "@/features/notes/NotesLayoutClient";

export default async function NotesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: workspaceId } = await params;
  return (
    <NotesLayoutClient workspaceId={workspaceId}>
      {children}
    </NotesLayoutClient>
  );
}
