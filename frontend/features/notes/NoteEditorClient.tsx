"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pin,
  PinOff,
  Star,
  StarOff,
  MoreVertical,
  Trash2,
  Link2,
  FileText,
  Eye,
  Edit3,
} from "lucide-react";
import { useNoteLinkAutocomplete } from "./useNoteLinkAutocomplete";
import { useNotesRealtime } from "@/hooks/useNotesSocket";
import { MarkdownContent } from "./MarkdownContent";

type NoteEditorClientProps = {
  workspaceId: string;
  initialNote: Note;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function NoteEditorClient({
  workspaceId,
  initialNote,
}: NoteEditorClientProps) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [title, setTitle] = useState(initialNote.title);
  const [content, setContent] = useState(initialNote.content);
  const [isPreview, setIsPreview] = useState(false);
  const [backlinks, setBacklinks] = useState<{ id: string; title: string }[]>([]);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const stateRef = useRef({ title, content, debouncedTitle: "", debouncedContent: "", note });

  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);

  stateRef.current = {
    title,
    content,
    debouncedTitle,
    debouncedContent,
    note,
  };

  const {
    showAutocomplete,
    autocompleteNotes,
    insertLink,
    hideAutocomplete,
    onContentChange,
  } = useNoteLinkAutocomplete(workspaceId, note.id, content, setContent, contentRef);

  useNotesRealtime(workspaceId, note.id, (updated) => {
    const s = stateRef.current;
    const hasPendingChanges =
      s.title !== s.debouncedTitle || s.content !== s.debouncedContent;
    const isNewer =
      new Date(updated.updatedAt).getTime() >
      new Date(s.note.updatedAt).getTime();
    if (!hasPendingChanges && isNewer) {
      setNote(updated);
      setTitle(updated.title);
      setContent(updated.content);
    }
  });

  useEffect(() => {
    setNote(initialNote);
    setTitle(initialNote.title);
    setContent(initialNote.content);
  }, [initialNote.id]);

  useEffect(() => {
    if (debouncedTitle !== note.title) {
      api.notes.notes
        .update(note.id, { title: debouncedTitle })
        .then((updated) => setNote(updated))
        .catch(() => {});
    }
  }, [debouncedTitle, note.id]);

  useEffect(() => {
    if (debouncedContent !== note.content) {
      api.notes.notes
        .update(note.id, { content: debouncedContent })
        .then((updated) => setNote(updated))
        .catch(() => {});
    }
  }, [debouncedContent, note.id]);

  useEffect(() => {
    api.notes.notes.getBacklinks(note.id).then(setBacklinks).catch(() => []);
  }, [note.id, debouncedContent]);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value;
      setContent(v);
      onContentChange(v, e.target.selectionStart ?? 0);
    },
    [onContentChange]
  );

  const handleTogglePin = useCallback(async () => {
    try {
      const updated = await api.notes.notes.update(note.id, {
        isPinned: !note.isPinned,
      });
      setNote(updated);
    } catch {
      //
    }
  }, [note.id, note.isPinned]);

  const handleToggleFavorite = useCallback(async () => {
    try {
      const updated = await api.notes.notes.update(note.id, {
        isFavorite: !note.isFavorite,
      });
      setNote(updated);
    } catch {
      //
    }
  }, [note.id, note.isFavorite]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Deletar esta nota?")) return;
    try {
      await api.notes.notes.delete(note.id);
      router.push(`/workspace/${workspaceId}/notes`);
    } catch {
      //
    }
  }, [note.id, workspaceId, router]);

  const wordCount = countWords(content);

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold border-0 px-0 shadow-none focus-visible:ring-0"
            placeholder="Título da nota"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleTogglePin}>
                {note.isPinned ? (
                  <>
                    <PinOff className="size-4 mr-2" />
                    Desafixar
                  </>
                ) : (
                  <>
                    <Pin className="size-4 mr-2" />
                    Fixar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleFavorite}>
                {note.isFavorite ? (
                  <>
                    <StarOff className="size-4 mr-2" />
                    Remover dos favoritos
                  </>
                ) : (
                  <>
                    <Star className="size-4 mr-2" />
                    Favoritar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="size-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Atualizado em {formatDate(note.updatedAt)}</span>
            <span>·</span>
            <span>{wordCount} palavras</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreview((p) => !p)}
            className="text-muted-foreground"
          >
            {isPreview ? (
              <>
                <Edit3 className="size-4 mr-1" />
                Editar
              </>
            ) : (
              <>
                <Eye className="size-4 mr-1" />
                Visualizar
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <ScrollArea className="flex-1 min-h-0">
          <div className="max-w-6xl mx-auto px-6 py-6 min-w-0">
            <div className="flex gap-4 min-w-0">
              <div className="flex-1 min-w-0 overflow-hidden">
                {isPreview ? (
                  <div className="overflow-x-hidden overflow-y-auto max-h-[calc(100vh-20rem)] rounded-lg border border-input bg-background">
                    <MarkdownContent
                      content={content}
                      workspaceId={workspaceId}
                      className="p-4"
                    />
                  </div>
                ) : (
                <div className="relative">
                  <textarea
                    ref={contentRef}
                    value={content}
                    onChange={handleContentChange}
                    onBlur={hideAutocomplete}
                    placeholder="Escreva sua nota em Markdown... # Título ## Subtítulo - Lista - [ ] Checklist [[Link para outra nota]] > Citação"
                    className="w-full h-[calc(100vh-20rem)] max-h-[calc(100vh-20rem)] p-4 rounded-lg border border-input bg-background text-foreground resize-none overflow-y-auto focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                    spellCheck={false}
                  />
                  {showAutocomplete && autocompleteNotes.length > 0 && !isPreview && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg py-1 z-50 max-h-48 overflow-y-auto">
                      {autocompleteNotes.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                          onClick={() => insertLink(n.title)}
                        >
                          <FileText className="size-4 text-muted-foreground" />
                          {n.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                )}
              </div>
              <div className="hidden lg:block w-80 flex-shrink-0">
                <div className="sticky top-4 space-y-4">
                  {backlinks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Link2 className="size-4" />
                        Referências
                      </h3>
                      <div className="space-y-1">
                        {backlinks.map((b) => (
                          <a
                            key={b.id}
                            href={`/workspace/${workspaceId}/notes/${b.id}`}
                            className="block text-sm text-primary hover:underline truncate"
                          >
                            {b.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {backlinks.length > 0 && (
              <div className="lg:hidden mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Link2 className="size-4" />
                  Notas que referenciam esta
                </h3>
                <div className="flex flex-wrap gap-2">
                  {backlinks.map((b) => (
                    <a
                      key={b.id}
                      href={`/workspace/${workspaceId}/notes/${b.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {b.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

