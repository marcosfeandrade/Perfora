"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";
import type { TimelineMode } from "./utils";

type TimelineHeaderProps = {
  title: string;
  mode: TimelineMode;
  onModeChange: (mode: TimelineMode) => void;
  centerDate: Date;
  onCenterDateChange: (date: Date) => void;
  filterAssigneeIds: string[];
  filterLabelIds: string[];
  allUsers: { id: string; email: string; name: string | null }[];
  allLabels: string[];
  boards: { id: string; name: string }[];
  onFilterAssigneesChange: (ids: string[]) => void;
  onFilterLabelsChange: (labels: string[]) => void;
  showAllTasks: boolean;
  onShowAllTasksChange: (show: boolean) => void;
  selectedBoardId: string | null;
  onSelectedBoardIdChange: (id: string | null) => void;
};

export function TimelineHeader({
  title,
  mode,
  onModeChange,
  centerDate,
  onCenterDateChange,
  filterAssigneeIds,
  filterLabelIds,
  allUsers,
  allLabels,
  boards,
  onFilterAssigneesChange,
  onFilterLabelsChange,
  showAllTasks,
  onShowAllTasksChange,
  selectedBoardId,
  onSelectedBoardIdChange,
}: TimelineHeaderProps) {
  const toggleAssignee = (id: string) => {
    if (filterAssigneeIds.includes(id)) {
      onFilterAssigneesChange(filterAssigneeIds.filter((x) => x !== id));
    } else {
      onFilterAssigneesChange([...filterAssigneeIds, id]);
    }
  };

  const goPrev = () => {
    const d = new Date(centerDate);
    if (mode === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    onCenterDateChange(d);
  };

  const goNext = () => {
    const d = new Date(centerDate);
    if (mode === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    onCenterDateChange(d);
  };

  const goToday = () => {
    onCenterDateChange(new Date());
  };

  const toggleLabel = (label: string) => {
    if (filterLabelIds.includes(label)) {
      onFilterLabelsChange(filterLabelIds.filter((x) => x !== label));
    } else {
      onFilterLabelsChange([...filterLabelIds, label]);
    }
  };

  const dateLabel = (() => {
    if (mode === "week") {
      const dayOfWeek = centerDate.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const start = new Date(centerDate);
      start.setDate(start.getDate() + diff);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString("pt-BR", { month: "short" })} ${start.getFullYear()}`;
    }
    return centerDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  })();

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border bg-card/50 shrink-0">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground truncate">
          {title}
        </h2>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goPrev}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-normal"
            onClick={goToday}
          >
            Hoje
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goNext}
          >
            <ChevronRight className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-1">{dateLabel}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Tabs
          value={mode}
          onValueChange={(v) => onModeChange(v as TimelineMode)}
        >
          <TabsList className="h-8">
            <TabsTrigger value="week" className="text-xs px-3">
              Semana
            </TabsTrigger>
            <TabsTrigger value="month" className="text-xs px-3">
              Mês
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="size-3.5 mr-1.5" />
              Filtros
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Escopo</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={
                showAllTasks || boards.length === 0
                  ? "all"
                  : selectedBoardId ?? boards[0]?.id ?? "all"
              }
              onValueChange={(v) => {
                if (v === "all") {
                  onShowAllTasksChange(true);
                  onSelectedBoardIdChange(null);
                } else {
                  onShowAllTasksChange(false);
                  onSelectedBoardIdChange(v);
                }
              }}
            >
              <DropdownMenuRadioItem value="all">
                Todas as tasks
              </DropdownMenuRadioItem>
              {boards.map((b) => (
                <DropdownMenuRadioItem key={b.id} value={b.id}>
                  {b.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Responsável</DropdownMenuLabel>
            {allUsers.map((u) => (
              <DropdownMenuCheckboxItem
                key={u.id}
                checked={filterAssigneeIds.includes(u.id)}
                onCheckedChange={() => toggleAssignee(u.id)}
              >
                {u.name || u.email}
              </DropdownMenuCheckboxItem>
            ))}
            {allLabels.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Label</DropdownMenuLabel>
                {allLabels.map((l) => (
                  <DropdownMenuCheckboxItem
                    key={l}
                    checked={filterLabelIds.includes(l)}
                    onCheckedChange={() => toggleLabel(l)}
                  >
                    {l}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
