"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Card as CardType } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CardDetailModalProps = {
  card: CardType;
  onClose: () => void;
  onTitleChange?: (cardId: string, title: string) => Promise<void>;
  onDescriptionChange?: (cardId: string, description: string) => Promise<void>;
};

export function CardDetailModal({
  card,
  onClose,
  onTitleChange,
  onDescriptionChange,
}: CardDetailModalProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(card.title);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(card.description ?? "");

  useEffect(() => {
    setTitleValue(card.title);
  }, [card.title]);

  useEffect(() => {
    setDescValue(card.description ?? "");
  }, [card.description]);

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

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
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
            className="w-full min-h-[120px] rounded-lg border border-input bg-background p-3 text-muted-foreground text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Adicione uma descrição (Markdown suportado)..."
            maxLength={2000}
          />
        ) : (
          <div
            onDoubleClick={() => onDescriptionChange && setIsEditingDesc(true)}
            className={cn(
              "text-muted-foreground text-sm min-h-[2.5rem] rounded p-2 -m-2",
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
      </DialogContent>
    </Dialog>
  );
}
