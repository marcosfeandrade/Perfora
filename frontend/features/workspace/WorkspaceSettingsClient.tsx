"use client";

import { useState, useCallback, useEffect } from "react";
import { Settings, Layout, FileText, Users, Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { api, type WorkspaceMember } from "@/lib/api";
import { useWorkspaces } from "@/contexts/WorkspaceContext";
import { getStoredUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const currentUser = getStoredUser();
  const [name, setName] = useState(initialName);
  const [plannerTaskPrefix, setPlannerTaskPrefix] = useState(initialPlannerTaskPrefix);
  const [savingName, setSavingName] = useState(false);
  const [savingPrefix, setSavingPrefix] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const list = await api.workspaces.members.list(workspaceId);
      setMembers(list);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const myMember = currentUser
    ? members.find((m) => m.userId === currentUser.id)
    : null;
  const canAddMembers =
    myMember?.role === "OWNER" || myMember?.role === "ADMIN";
  const canRemoveMember = (m: WorkspaceMember) => {
    if (!currentUser || m.userId === currentUser.id) return false;
    if (myMember?.role === "OWNER") return m.role !== "OWNER";
    if (myMember?.role === "ADMIN") return m.role === "MEMBER";
    return false;
  };

  const handleAddMember = useCallback(async () => {
    const email = addMemberEmail.trim().toLowerCase();
    if (!email) return;
    setAddingMember(true);
    setAddMemberError(null);
    try {
      await api.workspaces.members.add(workspaceId, { email });
      setAddMemberEmail("");
      setAddMemberOpen(false);
      await loadMembers();
    } catch (e) {
      setAddMemberError(e instanceof Error ? e.message : "Erro ao adicionar membro");
    } finally {
      setAddingMember(false);
    }
  }, [workspaceId, addMemberEmail, loadMembers]);

  const handleRemoveMember = useCallback(
    async (userId: string) => {
      setRemovingUserId(userId);
      try {
        await api.workspaces.members.remove(workspaceId, userId);
        await loadMembers();
      } finally {
        setRemovingUserId(null);
      }
    },
    [workspaceId, loadMembers]
  );

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
                Gerencie os membros deste workspace. Apenas donos e admins podem
                adicionar ou remover membros.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canAddMembers && (
                <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="size-4" />
                      Adicionar membro
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar membro</DialogTitle>
                      <DialogDescription>
                        Informe o email do usuário cadastrado no Perfora para
                        adicioná-lo ao workspace.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor="member-email">Email</Label>
                      <Input
                        id="member-email"
                        type="email"
                        placeholder="usuario@exemplo.com"
                        value={addMemberEmail}
                        onChange={(e) => {
                          setAddMemberEmail(e.target.value);
                          setAddMemberError(null);
                        }}
                      />
                      {addMemberError && (
                        <p className="text-sm text-destructive">{addMemberError}</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setAddMemberOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleAddMember}
                        disabled={addingMember || !addMemberEmail.trim()}
                      >
                        {addingMember ? "Adicionando..." : "Adicionar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              {membersLoading ? (
                <p className="text-sm text-muted-foreground">Carregando membros...</p>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum membro encontrado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      {canAddMembers && <TableHead className="w-[50px]" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          {m.user.name || m.user.email}
                          {m.userId === currentUser?.id && (
                            <span className="ml-2 text-muted-foreground text-xs">
                              (você)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{m.user.email}</TableCell>
                        <TableCell>
                          <span
                            className={
                              m.role === "OWNER"
                                ? "font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {m.role === "OWNER"
                              ? "Dono"
                              : m.role === "ADMIN"
                                ? "Admin"
                                : "Membro"}
                          </span>
                        </TableCell>
                        {canAddMembers && (
                          <TableCell>
                            {canRemoveMember(m) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                  >
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleRemoveMember(m.userId)}
                                    disabled={removingUserId === m.userId}
                                  >
                                    <Trash2 className="size-4 mr-2" />
                                    Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
