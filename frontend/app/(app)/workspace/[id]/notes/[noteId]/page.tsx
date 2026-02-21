import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { NoteEditorClient } from "@/features/notes/NoteEditorClient";

type NotePageProps = {
  params: Promise<{ id: string; noteId: string }>;
};

export default async function NotePage({ params }: NotePageProps) {
  const { id: workspaceId, noteId } = await params;
  let note;
  try {
    note = await api.notes.notes.get(noteId);
  } catch {
    notFound();
  }
  if (note.workspaceId !== workspaceId) notFound();

  return (
    <NoteEditorClient
      workspaceId={workspaceId}
      initialNote={note}
    />
  );
}
