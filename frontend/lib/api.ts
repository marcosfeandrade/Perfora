import type { Workspace, Board, Column, Card, NoteFolder, Note } from "@/lib/types";
import type { AuthUser } from "@/lib/auth";
import { getToken } from "@/lib/auth";

const isClient = typeof window !== "undefined";
const API_BASE = isClient ? "" : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000");
const API_PREFIX = isClient ? "/api" : "";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = isClient ? getToken() : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${API_BASE}${API_PREFIX}${path}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.message || text || `HTTP ${res.status}`);
    } catch (e) {
      const isParseError =
        e instanceof SyntaxError ||
        (e instanceof Error && e.message.includes("Unexpected token"));
      if (isParseError) {
        throw new Error(text || `HTTP ${res.status}`);
      }
      throw e;
    }
  }
  const text = await res.text();
  if (!text || text.trim() === "") return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || "Resposta inválida do servidor");
  }
}

export const api = {
  workspaces: {
    list: () => request<Workspace[]>("/workspaces"),
    get: (id: string) => request<Workspace>(`/workspaces/${id}`),
    create: (body: { name: string }) =>
      request<Workspace>("/workspaces", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: { name?: string; plannerTaskPrefix?: string | null; notesSettings?: Record<string, unknown> | null }) =>
      request<Workspace>(`/workspaces/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<void>(`/workspaces/${id}`, { method: "DELETE" }),
  },
  agile: {
    backlog: (workspaceId: string) =>
      request<Card[]>(`/agile/workspaces/${workspaceId}/backlog`),
    boards: {
      listByWorkspace: (workspaceId: string) =>
        request<Board[]>(`/agile/workspaces/${workspaceId}/boards`),
      get: (id: string) => request<Board>(`/agile/boards/${id}`),
      create: (body: { name: string; workspaceId: string }) =>
        request<Board>("/agile/boards", { method: "POST", body: JSON.stringify(body) }),
      update: (id: string, body: { name?: string }) =>
        request<Board>(`/agile/boards/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      delete: (id: string) =>
        request<void>(`/agile/boards/${id}`, { method: "DELETE" }),
    },
    columns: {
      create: (body: { name: string; order: number; boardId: string }) =>
        request<Column>("/agile/columns", { method: "POST", body: JSON.stringify(body) }),
      update: (id: string, body: { name?: string; order?: number; wipLimit?: number | null }) =>
        request<Column>(`/agile/columns/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      moveLeft: (id: string) =>
        request<Board>(`/agile/columns/${id}/move-left`, { method: "PATCH" }),
      moveRight: (id: string) =>
        request<Board>(`/agile/columns/${id}/move-right`, { method: "PATCH" }),
      delete: (id: string) =>
        request<void>(`/agile/columns/${id}`, { method: "DELETE" }),
    },
    cards: {
      create: (body: {
        title: string;
        description?: string;
        order: number;
        columnId?: string;
        workspaceId?: string;
        assigneeIds?: string[];
      }) =>
        request<Card>("/agile/cards", { method: "POST", body: JSON.stringify(body) }),
      update: (id: string, body: {
        title?: string;
        description?: string;
        order?: number;
        assigneeIds?: string[];
      }) =>
        request<Card>(`/agile/cards/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      delete: (id: string) =>
        request<void>(`/agile/cards/${id}`, { method: "DELETE" }),
      move: (id: string, body: { targetColumnId?: string | null; order: number }) =>
        request<Card>(`/agile/cards/${id}/move`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
    },
  },
  notes: {
    folders: {
      list: (workspaceId: string) =>
        request<NoteFolder[]>(`/notes/workspaces/${workspaceId}/folders`),
      create: (workspaceId: string, body: { name: string; parentId?: string }) =>
        request<NoteFolder>(`/notes/workspaces/${workspaceId}/folders`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      update: (id: string, body: { name?: string; parentId?: string | null; order?: number }) =>
        request<NoteFolder>(`/notes/folders/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      move: (id: string, body: { parentId?: string | null; order?: number }) =>
        request<NoteFolder>(`/notes/folders/${id}/move`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      delete: (id: string) =>
        request<void>(`/notes/folders/${id}`, { method: "DELETE" }),
    },
    notes: {
      list: (workspaceId: string) =>
        request<Note[]>(`/notes/workspaces/${workspaceId}/notes`),
      search: (workspaceId: string, query: string) =>
        request<Note[]>(`/notes/workspaces/${workspaceId}/notes/search?q=${encodeURIComponent(query)}`),
      get: (id: string) => request<Note>(`/notes/notes/${id}`),
      getBacklinks: (id: string) =>
        request<{ id: string; title: string }[]>(`/notes/notes/${id}/backlinks`),
      create: (workspaceId: string, body: { title: string; content?: string; folderId?: string }) =>
        request<Note>(`/notes/workspaces/${workspaceId}/notes`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      update: (id: string, body: { title?: string; content?: string; folderId?: string | null; isPinned?: boolean; isFavorite?: boolean }) =>
        request<Note>(`/notes/notes/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      move: (id: string, body: { folderId?: string | null; order?: number }) =>
        request<Note>(`/notes/notes/${id}/move`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      delete: (id: string) =>
        request<void>(`/notes/notes/${id}`, { method: "DELETE" }),
    },
  },
  auth: {
    login: (body: { email: string; password: string }) =>
      request<{ accessToken: string; user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    register: (body: {
      email: string;
      password: string;
      name?: string;
    }) =>
      request<{ accessToken: string; user: AuthUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    me: () => request<AuthUser>("/auth/me"),
    users: () =>
      request<AuthUser[]>("/auth/users").catch(() => [] as AuthUser[]),
  },
};
