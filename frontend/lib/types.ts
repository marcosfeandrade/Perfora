export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
}

export interface CardAssignee {
  id: string;
  email: string;
  name: string | null;
}

export interface Card {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  order: number;
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
