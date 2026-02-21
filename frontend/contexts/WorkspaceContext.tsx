"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/lib/api";

export type Workspace = {
  id: string;
  name: string;
};

type WorkspaceContextValue = {
  workspaces: Workspace[];
  createWorkspace: (name: string) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  const refreshWorkspaces = useCallback(async () => {
    try {
      const list = await api.workspaces.list();
      setWorkspaces(list.map((w) => ({ id: w.id, name: w.name })));
    } catch {
      setWorkspaces([]);
    }
  }, []);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  const createWorkspace = useCallback(async (name: string) => {
    const ws = await api.workspaces.create({ name });
    setWorkspaces((prev) => [...prev, { id: ws.id, name: ws.name }]);
    return { id: ws.id, name: ws.name };
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{ workspaces, createWorkspace, refreshWorkspaces }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaces() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaces must be used within WorkspaceProvider");
  return ctx;
}
