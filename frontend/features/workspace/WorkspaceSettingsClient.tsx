"use client";

import { useState, useCallback } from "react";
import { Settings, Layout, FileText, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspaces } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type WorkspaceSettingsClientProps = {
  workspaceId: string;
  initialName: string;
  initialPlannerTaskPrefix: string;
};

const SECTIONS = [
  { id: "detalhes", label: "Detalhes", icon: Settings },
  { id: "acesso", label: "Acesso", icon: Users },
  { id: "planner", label: "Planner", icon: Layout },
  { id: "notas", label: "Notas", icon: FileText },
] as const;

export function WorkspaceSettingsClient({
  workspaceId,
  initialName,
  initialPlannerTaskPrefix,
}: WorkspaceSettingsClientProps) {
  const { refreshWorkspaces } = useWorkspaces();
  const [name, setName] = useState(initialName);
  const [plannerTaskPrefix, setPlannerTaskPrefix] = useState(initialPlannerTaskPrefix);
  const [savingName, setSavingName] = useState(false);
  const [savingPrefix, setSavingPrefix] = useState(false);

  const handleSaveName = useCallback(async () => {
    if (name.trim() === initialName) return;
    setSavingName(true);
    try {
      await api.workspaces.update(workspaceId, { name: name.trim() });
      await refreshWorkspaces();
    } finally {
      setSavingName(false);
    }
  }, [workspaceId, name, initialName, refreshWorkspaces]);

  const handleSavePrefix = useCallback(async () => {
    const value = plannerTaskPrefix.trim() || null;
    if (value === (initialPlannerTaskPrefix || null)) return;
    setSavingPrefix(true);
    try {
      await api.workspaces.update(workspaceId, { plannerTaskPrefix: value });
    } finally {
      setSavingPrefix(false);
    }
  }, [workspaceId, plannerTaskPrefix, initialPlannerTaskPrefix]);

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-lg font-semibold text-foreground mb-6">Configurações</h2>

      <Tabs defaultValue="detalhes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger key={id} value={id} className="gap-2">
              <Icon className="size-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="detalhes" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do workspace</CardTitle>
              <CardDescription>
                Configure o nome e informações básicas do workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Nome</Label>
                <div className="flex gap-2">
                  <Input
                    id="workspace-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome do workspace"
                    className="max-w-sm"
                  />
                  <Button
                    onClick={handleSaveName}
                    disabled={savingName || name.trim() === initialName}
                  >
                    {savingName ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acesso" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Acesso</CardTitle>
              <CardDescription>
                Configure quem pode acessar este workspace. Em breve será possível
                convidar usuários para participar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                <Users className="size-4 shrink-0" />
                <span>Funcionalidade de convites em desenvolvimento.</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planner" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Planner</CardTitle>
              <CardDescription>
                Configure o prefixo para os códigos das tasks. Ao criar uma task, ela
                receberá automaticamente um código como PREFIXO-1, PREFIXO-2, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-prefix">Prefixo das tasks</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="task-prefix"
                    value={plannerTaskPrefix}
                    onChange={(e) => setPlannerTaskPrefix(e.target.value.toUpperCase())}
                    placeholder="Ex: SHO, TASK, PROJ"
                    maxLength={20}
                    className="max-w-[200px] uppercase"
                  />
                  <span className="text-muted-foreground text-sm">
                    {plannerTaskPrefix ? `Ex: ${plannerTaskPrefix.toUpperCase()}-1` : "Deixe vazio para desativar"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSavePrefix}
                    disabled={savingPrefix || (plannerTaskPrefix.trim() || null) === (initialPlannerTaskPrefix || null)}
                  >
                    {savingPrefix ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notas" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de notas</CardTitle>
              <CardDescription>
                Configure o comportamento das notas neste workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                <FileText className="size-4 shrink-0" />
                <span>Opções de configuração em desenvolvimento.</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
