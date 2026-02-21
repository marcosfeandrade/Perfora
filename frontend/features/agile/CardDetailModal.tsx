"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { api } from "@/lib/api";
import type { Card as CardType } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CardAssigneePicker } from "./CardAssigneePicker";
import { cn } from "@/lib/utils";
import { Users, Tag, Calendar, User, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CardAssignee = { id: string; email: string; name: string | null };

type CardDetailModalProps = {
  card: CardType;
  workspaceId?: string;
  allUsers?: { id: string; email: string; name: string | null }[];
  availableLabels?: string[];
  onClose: () => void;
  onTitleChange?: (cardId: string, title: string) => Promise<void>;
  onDescriptionChange?: (cardId: string, description: string) => Promise<void>;
  onAssigneesChange?: (cardId: string, assigneeIds: string[]) => Promise<void>;
  onLabelsChange?: (cardId: string, labels: string[]) => Promise<void>;
  onStartDateChange?: (cardId: string, date: string | null) => Promise<void>;
  onDueDateChange?: (cardId: string, date: string | null) => Promise<void>;
  onPriorityChange?: (cardId: string, priority: string | null) => Promise<void>;
};

const PRIORITY_OPTIONS = [
  { value: "low", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
] as const;

function normalizeAssignees(assignees: CardType["assignees"]): CardAssignee[] {
  if (!assignees?.length) return [];
  return assignees.map((a): CardAssignee => {
    const item = a as { user?: CardAssignee };
    return item.user ?? (a as CardAssignee);
  });
}

export function CardDetailModal({
  card,
  workspaceId,
  allUsers,
  availableLabels,
  onClose,
  onTitleChange,
  onDescriptionChange,
  onAssigneesChange,
  onLabelsChange,
  onStartDateChange,
  onDueDateChange,
  onPriorityChange,
}: CardDetailModalProps) {
  const [availableLabelsState, setAvailableLabelsState] = useState<string[]>(
    availableLabels ?? []
  );
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(card.title);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(card.description ?? "");
  const [labelInput, setLabelInput] = useState("");
  const [labels, setLabels] = useState<string[]>(card.labels ?? []);

  const assignees = normalizeAssignees(card.assignees);
  const users = allUsers ?? [];
  const labelsToShow = availableLabelsState.length ? availableLabelsState : [...labels];
  const startDate = card.startDate
    ? new Date(card.startDate).toISOString().slice(0, 10)
    : "";
  const dueDate = card.dueDate
    ? new Date(card.dueDate).toISOString().slice(0, 10)
    : "";

  useEffect(() => {
    setTitleValue(card.title);
  }, [card.title]);

  useEffect(() => {
    setDescValue(card.description ?? "");
  }, [card.description]);

  useEffect(() => {
    setLabels(card.labels ?? []);
  }, [card.labels]);

  useEffect(() => {
    if (availableLabels?.length) {
      setAvailableLabelsState(availableLabels);
    } else if (workspaceId) {
      api.workspaces.get(workspaceId).then((ws) => {
        setAvailableLabelsState((ws.labels as string[]) ?? []);
      }).catch(() => {});
    }
  }, [workspaceId, availableLabels]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isEditingTitle) {
          setTitleValue(card.title);
          setIsEditingTitle(false);
        } else if (isEditingDesc) {
          setDescValue(card.description ?? "");
          setIsEditingDesc(false);
        } else {
          onClose();
        }
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, isEditingTitle, isEditingDesc, card.title, card.description]);

  const handleTitleBlur = async () => {
    if (!onTitleChange) {
      setIsEditingTitle(false);
      return;
    }
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== card.title) {
      await onTitleChange(card.id, trimmed);
    } else {
      setTitleValue(card.title);
    }
    setIsEditingTitle(false);
  };

  const handleDescBlur = async () => {
    if (!onDescriptionChange) {
      setIsEditingDesc(false);
      return;
    }
    const trimmed = descValue.trim();
    if (trimmed !== (card.description ?? "")) {
      await onDescriptionChange(card.id, trimmed);
    }
    setIsEditingDesc(false);
  };

  const handleAddLabel = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed || labels.includes(trimmed)) return;
    const newLabels = [...labels, trimmed];
    setLabels(newLabels);
    setLabelInput("");
    onLabelsChange?.(card.id, newLabels);
  };

  const handleRemoveLabel = (label: string) => {
    const newLabels = labels.filter((l) => l !== label);
    setLabels(newLabels);
    onLabelsChange?.(card.id, newLabels);
  };

  const handleStartDateChange = async (value: string) => {
    const date = value || null;
    onStartDateChange?.(card.id, date);
  };

  const handleDueDateChange = async (value: string) => {
    const date = value || null;
    onDueDateChange?.(card.id, date);
  };

  const priorityLabel =
    PRIORITY_OPTIONS.find((o) => o.value === card.priority)?.label ?? "Nenhuma";

  const handlePrioritySelect = (value: string | null) => {
    onPriorityChange?.(card.id, value);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex gap-6 overflow-hidden flex-1 min-h-0">
          <div className="flex-1 min-w-0 overflow-y-auto">
            <DialogHeader>
              {isEditingTitle ? (
                <Input
                  autoFocus
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  className="text-lg font-semibold"
                  maxLength={500}
                />
              ) : (
                <DialogTitle
                  onDoubleClick={() => onTitleChange && setIsEditingTitle(true)}
                  className={cn(
                    "cursor-text rounded px-2 -mx-2 flex items-center min-h-[1.75rem]",
                    onTitleChange && "hover:bg-accent/50"
                  )}
                >
                  {card.title}
                </DialogTitle>
              )}
              {card.code && (
                <p className="text-muted-foreground text-sm -mt-1 px-2">{card.code}</p>
              )}
            </DialogHeader>
            {isEditingDesc ? (
              <textarea
                autoFocus
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                onBlur={handleDescBlur}
                className="w-full min-h-[120px] rounded-lg border border-input bg-background p-3 text-muted-foreground text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring mt-4"
                placeholder="Adicione uma descrição (Markdown suportado)..."
                maxLength={2000}
              />
            ) : (
              <div
                onDoubleClick={() => onDescriptionChange && setIsEditingDesc(true)}
                className={cn(
                  "text-muted-foreground text-sm min-h-[2.5rem] rounded p-2 -m-2 mt-4",
                  "[&_p]:my-1 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm",
                  "[&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-medium",
                  "[&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground",
                  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:my-0.5",
                  "[&_code]:bg-muted [&_code]:text-primary [&_code]:px-1 [&_code]:rounded [&_code]:text-xs",
                  "[&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0",
                  "[&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline",
                  "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic",
                  onDescriptionChange && "cursor-text hover:bg-accent/50"
                )}
              >
                {card.description ? (
                  <ReactMarkdown>{card.description}</ReactMarkdown>
                ) : (
                  <span className="italic">
                    {onDescriptionChange
                      ? "Clique duas vezes para adicionar descrição"
                      : "Sem descrição"}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="w-56 shrink-0 border-l border-border pl-4 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground">Detalhes</h3>
            {onAssigneesChange && users.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Users className="size-3" />
                  Responsáveis
                </p>
                <div className="flex items-center gap-1 flex-wrap">
                  {assignees.slice(0, 2).map((a) => (
                    <span
                      key={a.id}
                      className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary"
                      title={a.name || a.email}
                    >
                      {(a.name || a.email)?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  ))}
                  {assignees.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{assignees.length - 2}
                    </span>
                  )}
                  <CardAssigneePicker
                    cardId={card.id}
                    assignees={assignees}
                    allUsers={users}
                    onAssigneesChange={onAssigneesChange}
                  />
                </div>
              </div>
            )}
            {onLabelsChange && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Tag className="size-3" />
                  Labels
                </p>
                <div className="flex flex-wrap gap-1 mb-1">
                  {labels.map((l) => (
                    <span
                      key={l}
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs"
                    >
                      {l}
                      <button
                        type="button"
                        onClick={() => handleRemoveLabel(l)}
                        className="hover:bg-primary/20 rounded p-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <Input
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddLabel(labelInput);
                      }
                    }}
                    placeholder="Adicionar..."
                    className="h-8 text-xs"
                    list={`label-suggestions-${card.id}`}
                  />
                  <datalist id={`label-suggestions-${card.id}`}>
                    {labelsToShow
                      .filter((l) => !labels.includes(l))
                      .map((l) => (
                        <option key={l} value={l} />
                      ))}
                  </datalist>
                </div>
              </div>
            )}
            {onStartDateChange && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="size-3" />
                  Data de início
                </p>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            )}
            {onDueDateChange && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="size-3" />
                  Data de vencimento
                </p>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            )}
            {onPriorityChange && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Flag className="size-3" />
                  Prioridade
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-full h-8 px-2 rounded-md border border-input bg-background text-left text-xs text-foreground hover:bg-accent"
                    >
                      {priorityLabel}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[140px]">
                    {PRIORITY_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onSelect={() => handlePrioritySelect(opt.value)}
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      onSelect={() => handlePrioritySelect(null)}
                      className="text-muted-foreground"
                    >
                      Limpar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            {card.createdBy && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="size-3" />
                  Criador
                </p>
                <p className="text-sm text-foreground">
                  {card.createdBy.name || card.createdBy.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
