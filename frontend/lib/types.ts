export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  plannerTaskPrefix?: string | null;
  notesSettings?: Record<string, unknown> | null;
  labels?: string[] | null;
}

export interface CardAssignee {
  id: string;
  email: string;
  name: string | null;
}

export interface Card {
  id: string;
  columnId: string | null;
  workspaceId: string;
  title: string;
  code?: string | null;
  description: string | null;
  order: number;
  startDate?: string | null;
  dueDate?: string | null;
  labels?: string[] | null;
  priority?: string | null;
  createdBy?: { id: string; email: string; name: string | null } | null;
  assignees?: CardAssignee[];
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  order: number;
  wipLimit?: number | null;
  cards: Card[];
}

export interface Board {
  id: string;
  workspaceId: string;
  name: string;
  columns: Column[];
}

export interface NoteFolder {
  id: string;
  name: string;
  parentId: string | null;
  workspaceId: string;
  order: number;
  children?: NoteFolder[];
  notes?: Note[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  workspaceId: string;
  isPinned: boolean;
  isFavorite: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
