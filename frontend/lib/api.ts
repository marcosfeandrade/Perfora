import type { Workspace, Board, Column, Card } from "@/lib/types";
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
      if (e instanceof Error && e.message !== text) throw e;
      throw new Error(text || `HTTP ${res.status}`);
    }
  }
  const text = await res.text();
  if (!text || text.trim() === "") return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  workspaces: {
    list: () => request<Workspace[]>("/workspaces"),
    get: (id: string) => request<Workspace>(`/workspaces/${id}`),
    create: (body: { name: string }) =>
      request<Workspace>("/workspaces", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: { name?: string }) =>
      request<Workspace>(`/workspaces/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<void>(`/workspaces/${id}`, { method: "DELETE" }),
  },
  agile: {
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
        columnId: string;
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
      move: (id: string, body: { targetColumnId: string; order: number }) =>
        request<Card>(`/agile/cards/${id}/move`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
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
    me: () =>
      request<AuthUser>("/auth/me"),
    users: () =>
      request<AuthUser[]>("/auth/users"),
  },
};
