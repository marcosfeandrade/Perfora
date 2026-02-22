"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { NoteEditorClient } from "@/features/notes/NoteEditorClient";
import type { Note } from "@/lib/types";

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  const noteId = params.noteId as string;
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.notes.notes
      .get(noteId)
      .then((n) => {
        if (!cancelled && n.workspaceId !== workspaceId) {
          router.replace(`/workspace/${workspaceId}/notes`);
          return;
        }
        if (!cancelled) setNote(n);
      })
      .catch(() => {
        if (!cancelled) router.replace(`/workspace/${workspaceId}/notes`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [noteId, workspaceId, router]);

  if (loading || !note) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando nota...</p>
      </div>
    );
  }

  return (
    <NoteEditorClient workspaceId={workspaceId} initialNote={note} />
  );
}
