"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { NoteFolder, Note } from "@/lib/types";
import { useNotesStructureRealtime } from "@/hooks/useNotesSocket";
import { NotesSidebar } from "./NotesSidebar";

type NotesLayoutClientProps = {
  workspaceId: string;
  children: React.ReactNode;
};

export function NotesLayoutClient({
  workspaceId,
  children,
}: NotesLayoutClientProps) {
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [foldersData, notesData] = await Promise.all([
        api.notes.folders.list(workspaceId),
        api.notes.notes.list(workspaceId),
      ]);
      setFolders(foldersData);
      setNotes(notesData);
    } catch {
      setFolders([]);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useNotesStructureRealtime(workspaceId, refresh);

  const handleNoteCreated = useCallback(
    (note: Note) => {
      refresh();
      router.push(`/workspace/${workspaceId}/notes/${note.id}`);
    },
    [workspaceId, refresh, router]
  );

  const handleNoteDeleted = useCallback(() => {
    refresh();
    router.push(`/workspace/${workspaceId}/notes`);
  }, [workspaceId, refresh, router]);

  const noteId = pathname?.match(/\/notes\/([^/]+)/)?.[1];

  return (
    <div className="flex flex-1 min-h-0">
      <NotesSidebar
        workspaceId={workspaceId}
        folders={folders}
        notes={notes}
        activeNoteId={noteId ?? null}
        loading={loading}
        onRefresh={refresh}
        onNoteCreated={handleNoteCreated}
      />
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
