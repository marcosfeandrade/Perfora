"use client";

import { useCallback, useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Note } from "@/lib/types";

export function useNoteLinkAutocomplete(
  workspaceId: string,
  currentNoteId: string,
  content: string,
  setContent: (v: string) => void,
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteNotes, setAutocompleteNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState("");
  const [cursorPos, setCursorPos] = useState(0);

  useEffect(() => {
    const beforeCursor = content.slice(0, cursorPos);
    const match = beforeCursor.match(/\[\[([^\]]*)$/);
    if (match) {
      setQuery(match[1]);
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  }, [content, cursorPos]);

  useEffect(() => {
    if (!showAutocomplete) return;
    const timer = setTimeout(async () => {
      try {
        const notes = await api.notes.notes.search(workspaceId, query);
        setAutocompleteNotes(
          notes.filter((n) => n.id !== currentNoteId).slice(0, 8)
        );
      } catch {
        setAutocompleteNotes([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [showAutocomplete, query, workspaceId, currentNoteId]);

  const onContentChange = useCallback(
    (value: string, selectionStart: number) => {
      setCursorPos(selectionStart);
    },
    []
  );

  const insertLink = useCallback(
    (noteTitle: string) => {
      const beforeCursor = content.slice(0, cursorPos);
      const afterCursor = content.slice(cursorPos);
      const match = beforeCursor.match(/\[\[([^\]]*)$/);
      if (match) {
        const start = beforeCursor.length - match[0].length;
        const newContent =
          content.slice(0, start) + `[[${noteTitle}]]` + afterCursor;
        setContent(newContent);
        setShowAutocomplete(false);
        setTimeout(() => {
          textareaRef.current?.focus();
          const pos = start + noteTitle.length + 4;
          textareaRef.current?.setSelectionRange(pos, pos);
        }, 0);
      }
    },
    [content, cursorPos, setContent, textareaRef]
  );

  const hideAutocomplete = useCallback(() => {
    setShowAutocomplete(false);
  }, []);

  return {
    showAutocomplete,
    autocompleteNotes,
    insertLink,
    hideAutocomplete,
    onContentChange,
  };
}
