"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  Plus,
  Pin,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { CreateNoteDialog } from "./CreateNoteDialog";
import { NotesSidebarDnd } from "./NotesSidebarDnd";
import { DraggableNote } from "./DraggableNote";
import { DraggableFolder } from "./DraggableFolder";
import { DroppableFolder } from "./DroppableFolder";
import { DroppableRoot } from "./DroppableRoot";
import { api } from "@/lib/api";
import type { NoteFolder, Note } from "@/lib/types";
import { cn } from "@/lib/utils";

type NotesSidebarProps = {
  workspaceId: string;
  folders: NoteFolder[];
  notes: Note[];
  activeNoteId: string | null;
  loading: boolean;
  onRefresh: () => void;
  onNoteCreated: (note: Note) => void;
  onNoteDeleted?: () => void;
};

function collectAllNotes(folders: NoteFolder[], rootNotes: Note[]): Note[] {
  const result: Note[] = [...rootNotes];
  function walk(fs: NoteFolder[]) {
    for (const f of fs) {
      if (f.notes) result.push(...f.notes);
      if (f.children) walk(f.children);
    }
  }
  walk(folders);
  return result;
}

export function NotesSidebar({
  workspaceId,
  folders,
  notes,
  activeNoteId,
  loading,
  onRefresh,
  onNoteCreated,
  onNoteDeleted,
}: NotesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createNoteOpen, setCreateNoteOpen] = useState(false);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [renameNoteId, setRenameNoteId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const rootNotes = notes.filter((n) => !n.folderId);
  const allNotes = collectAllNotes(folders, rootNotes);
  const searchResults = searchQuery.trim()
    ? allNotes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateFolder = (parentId?: string) => {
    setParentFolderId(parentId ?? null);
    setCreateFolderOpen(true);
  };

  const handleCreateNote = (folderId?: string) => {
    setParentFolderId(folderId ?? null);
    setCreateNoteOpen(true);
  };

  const handleRenameFolder = async () => {
    if (!renameFolderId || !renameValue.trim()) return;
    try {
      await api.notes.folders.update(renameFolderId, { name: renameValue.trim() });
      onRefresh();
      setRenameFolderId(null);
      setRenameValue("");
    } catch {
      //
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm("Deletar esta pasta e todo o conteúdo?")) return;
    try {
      await api.notes.folders.delete(id);
      onRefresh();
    } catch {
      //
    }
  };

  const handleRenameNote = async () => {
    if (!renameNoteId || !renameValue.trim()) return;
    try {
      await api.notes.notes.update(renameNoteId, { title: renameValue.trim() });
      onRefresh();
      setRenameNoteId(null);
      setRenameValue("");
    } catch {
      //
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Deletar esta nota?")) return;
    try {
      await api.notes.notes.delete(id);
      onRefresh();
      if (activeNoteId === id) onNoteDeleted?.();
    } catch {
      //
    }
  };

  return (
    <>
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center gap-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => handleCreateNote()}
            >
              <Plus className="size-3.5 mr-1" />
              Nota
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => handleCreateFolder()}
            >
              <Folder className="size-3.5 mr-1" />
              Pasta
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {loading ? (
              <p className="text-muted-foreground text-sm py-4">Carregando...</p>
            ) : searchResults ? (
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground px-2 py-1">
                  Resultados
                </p>
                {searchResults.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-center gap-1 rounded-md group",
                      activeNoteId === n.id
                        ? "bg-primary/10 text-primary border-l-2 border-l-primary"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    <Link
                      href={`/workspace/${workspaceId}/notes/${n.id}`}
                      className={cn(
                        "flex items-center gap-2 flex-1 min-w-0 px-2 py-1.5 rounded-md text-sm transition-all duration-200",
                        activeNoteId === n.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent"
                      )}
                    >
                      <FileText className="size-4 shrink-0" />
                      <span className="truncate">{n.title}</span>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 opacity-0 group-hover:opacity-100 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setRenameNoteId(n.id);
                            setRenameValue(n.title);
                          }}
                        >
                          <Pencil className="size-4 mr-2" />
                          Renomear
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteNote(n.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="size-4 mr-2" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ) : (
              <NotesSidebarDnd workspaceId={workspaceId} onDrop={onRefresh}>
                <FolderTree
                  workspaceId={workspaceId}
                  folders={folders}
                  rootNotes={rootNotes}
                  activeNoteId={activeNoteId}
                  expandedFolders={expandedFolders}
                  onToggleFolder={toggleFolder}
                  onCreateFolder={handleCreateFolder}
                  onCreateNote={handleCreateNote}
                  onRenameFolder={(id, name) => {
                    setRenameFolderId(id);
                    setRenameValue(name);
                  }}
                  onDeleteFolder={handleDeleteFolder}
                  onRenameNote={(id, title) => {
                    setRenameNoteId(id);
                    setRenameValue(title);
                  }}
                  onDeleteNote={handleDeleteNote}
                />
              </NotesSidebarDnd>
            )}
          </div>
        </ScrollArea>
      </aside>

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        workspaceId={workspaceId}
        parentId={parentFolderId}
        onCreated={() => {
          onRefresh();
          setCreateFolderOpen(false);
        }}
      />

      <CreateNoteDialog
        open={createNoteOpen}
        onOpenChange={setCreateNoteOpen}
        workspaceId={workspaceId}
        folderId={parentFolderId}
        onCreated={(note) => {
          onNoteCreated(note);
          setCreateNoteOpen(false);
        }}
      />

      <Dialog open={!!renameFolderId} onOpenChange={() => setRenameFolderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear pasta</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Nome da pasta"
            onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameFolderId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRenameFolder} disabled={!renameValue.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameNoteId} onOpenChange={() => setRenameNoteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear nota</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Título da nota"
            onKeyDown={(e) => e.key === "Enter" && handleRenameNote()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameNoteId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRenameNote} disabled={!renameValue.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type FolderTreeProps = {
  workspaceId: string;
  folders: NoteFolder[];
  rootNotes: Note[];
  activeNoteId: string | null;
  expandedFolders: Set<string>;
  onToggleFolder: (id: string) => void;
  onCreateFolder: (parentId?: string) => void;
  onCreateNote: (folderId?: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameNote: (id: string, title: string) => void;
  onDeleteNote: (id: string) => void;
};

type FolderItemProps = Omit<
  FolderTreeProps,
  "folders" | "rootNotes"
> & {
  folder: NoteFolder;
  depth: number;
};

function FolderTree({
  workspaceId,
  folders,
  rootNotes,
  activeNoteId,
  expandedFolders,
  onToggleFolder,
  onCreateFolder,
  onCreateNote,
  onRenameFolder,
  onDeleteFolder,
  onRenameNote,
  onDeleteNote,
}: FolderTreeProps) {
  return (
    <div className="space-y-0.5">
      <DroppableRoot>
        <div className="space-y-0.5">
          {rootNotes
            .filter((n) => n.isPinned)
            .map((n) => (
              <DraggableNote
                key={n.id}
                note={n}
                workspaceId={workspaceId}
                activeNoteId={activeNoteId}
                showPin
                alignWithFolder
                onRename={onRenameNote}
                onDelete={onDeleteNote}
              />
            ))}
          {rootNotes.filter((n) => !n.isPinned).length > 0 && (
            <>
              <p className="text-xs text-muted-foreground px-2 py-1 mt-2">
                Sem pasta
              </p>
              {rootNotes
                .filter((n) => !n.isPinned)
                .map((n) => (
                  <DraggableNote
                    key={n.id}
                    note={n}
                    workspaceId={workspaceId}
                    activeNoteId={activeNoteId}
                    alignWithFolder
                    onRename={onRenameNote}
                    onDelete={onDeleteNote}
                  />
                ))}
            </>
          )}
        </div>
      </DroppableRoot>
      {folders.map((folder) => (
        <DroppableFolder key={folder.id} folderId={folder.id}>
          <FolderItem
          key={folder.id}
          workspaceId={workspaceId}
          folder={folder}
          activeNoteId={activeNoteId}
          expandedFolders={expandedFolders}
          onToggleFolder={onToggleFolder}
          onCreateFolder={onCreateFolder}
          onCreateNote={onCreateNote}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          onRenameNote={onRenameNote}
          onDeleteNote={onDeleteNote}
          depth={0}
        />
        </DroppableFolder>
      ))}
    </div>
  );
}

function FolderItem({
  workspaceId,
  folder,
  activeNoteId,
  expandedFolders,
  onToggleFolder,
  onCreateFolder,
  onCreateNote,
  onRenameFolder,
  onDeleteFolder,
  onRenameNote,
  onDeleteNote,
  depth,
}: FolderItemProps) {
  const isExpanded = expandedFolders.has(folder.id);
  const hasChildren =
    (folder.children && folder.children.length > 0) ||
    (folder.notes && folder.notes.length > 0);

  return (
    <div className="mt-1">
      <DraggableFolder folder={folder} isExpanded={isExpanded}>
        <div
          className={cn(
            "flex items-center gap-1 rounded-md group",
            "hover:bg-accent/50"
          )}
        >
          <button
            type="button"
            onClick={() => onToggleFolder(folder.id)}
            className="p-0.5 rounded hover:bg-accent flex items-center"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )
            ) : (
              <span className="size-4 inline-block" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onToggleFolder(folder.id)}
            className="flex-1 flex items-center min-w-0 py-1 text-left"
          >
            {isExpanded ? (
              <FolderOpen className="size-4 shrink-0 text-primary/80" />
            ) : (
              <Folder className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate text-sm ml-1.5">{folder.name}</span>
          </button>
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onCreateNote(folder.id)}>
              Nova nota
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateFolder(folder.id)}>
              Nova subpasta
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRenameFolder(folder.id, folder.name)}
            >
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDeleteFolder(folder.id)}
              className="text-destructive"
            >
              Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </DraggableFolder>
      {isExpanded && (
        <div className="ml-4 border-l border-border pl-1">
          {(folder.notes ?? [])
            .sort((a, b) => (a.isPinned ? -1 : 0) - (b.isPinned ? -1 : 0))
            .map((n) => (
              <DraggableNote
                key={n.id}
                note={n}
                workspaceId={workspaceId}
                activeNoteId={activeNoteId}
                showPin={n.isPinned}
                onRename={onRenameNote}
                onDelete={onDeleteNote}
              />
            ))}
          {(folder.children ?? []).map((child) => (
            <DroppableFolder key={child.id} folderId={child.id}>
            <FolderItem
              key={child.id}
              workspaceId={workspaceId}
              folder={child}
              activeNoteId={activeNoteId}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onCreateFolder={onCreateFolder}
              onCreateNote={onCreateNote}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onRenameNote={onRenameNote}
              onDeleteNote={onDeleteNote}
              depth={depth + 1}
            />
            </DroppableFolder>
          ))}
        </div>
      )}
    </div>
  );
}
