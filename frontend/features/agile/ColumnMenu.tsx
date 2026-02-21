"use client";

import { useState, useRef, useEffect } from "react";
import type { Column as ColumnType } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { MoreVertical, ChevronLeft, ChevronRight, Hash, Trash2 } from "lucide-react";

type ColumnMenuProps = {
  column: ColumnType;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onSetWipLimit: (limit: number | null) => void;
  onDelete: () => void;
};

export function ColumnMenu({
  column,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
  onSetWipLimit,
  onDelete,
}: ColumnMenuProps) {
  const [wipModalOpen, setWipModalOpen] = useState(false);
  const [wipValue, setWipValue] = useState(String(column.wipLimit ?? ""));

  function handleSetWipLimit() {
    const n = parseInt(wipValue, 10);
    if (!Number.isNaN(n) && n >= 1) {
      onSetWipLimit(n);
    } else if (wipValue.trim() === "") {
      onSetWipLimit(null);
    }
    setWipModalOpen(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Opções da coluna"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          <DropdownMenuItem
            onClick={() => onMoveLeft()}
            disabled={!canMoveLeft}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="size-4" />
            Mover para esquerda
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onMoveRight()}
            disabled={!canMoveRight}
            className="flex items-center gap-2"
          >
            <ChevronRight className="size-4" />
            Mover para direita
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setWipModalOpen(true);
              setWipValue(String(column.wipLimit ?? ""));
            }}
            className="flex items-center gap-2"
          >
            <Hash className="size-4" />
            Limite WIP
            {(column.wipLimit ?? null) != null && (
              <span className="text-muted-foreground text-xs">({column.wipLimit})</span>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete()}
            className="flex items-center gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            Deletar coluna
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={wipModalOpen} onOpenChange={setWipModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limite WIP</DialogTitle>
            <DialogDescription>
              Número máximo de cards nesta coluna. Deixe vazio para sem limite.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            min={1}
            value={wipValue}
            onChange={(e) => setWipValue(e.target.value)}
            placeholder="Ex: 3"
            className="mb-4"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setWipModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSetWipLimit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
