"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Card as CardType } from "@/lib/types";

type CardDetailModalProps = {
  card: CardType;
  onClose: () => void;
  onTitleChange?: (cardId: string, title: string) => Promise<void>;
  onDescriptionChange?: (cardId: string, description: string) => Promise<void>;
};

export function CardDetailModal({ card, onClose, onTitleChange, onDescriptionChange }: CardDetailModalProps) {
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
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-surface border border-white/10 shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          {isEditingTitle ? (
            <input
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="flex-1 text-lg font-semibold text-text bg-background border border-white/10 rounded px-2 py-1 focus:outline-none focus:border-primary/50"
              maxLength={500}
            />
          ) : (
            <h2
              onDoubleClick={() => onTitleChange && setIsEditingTitle(true)}
              className={`text-lg font-semibold text-text flex-1 min-h-[1.75rem] rounded px-2 -mx-2 flex items-center ${
                onTitleChange ? "cursor-text hover:bg-white/5" : ""
              }`}
            >
              {card.title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-muted hover:text-text transition-colors"
            aria-label="Fechar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {isEditingDesc ? (
          <textarea
            autoFocus
            value={descValue}
            onChange={(e) => setDescValue(e.target.value)}
            onBlur={handleDescBlur}
            className="w-full min-h-[120px] rounded-lg bg-background border border-white/10 p-3 text-muted text-sm resize-y focus:outline-none focus:border-primary/50"
            placeholder="Adicione uma descrição (Markdown suportado)..."
            maxLength={2000}
          />
        ) : (
          <div
            onDoubleClick={() => onDescriptionChange && setIsEditingDesc(true)}
            className={`text-muted text-sm min-h-[2.5rem] rounded p-2 -m-2 [&_p]:my-1 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-medium [&_h1]:text-text [&_h2]:text-text [&_h3]:text-text [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:my-0.5 [&_code]:bg-white/10 [&_code]:text-accent [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-white/10 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic ${
              onDescriptionChange ? "cursor-text hover:bg-white/5" : ""
            }`}
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
    </div>
  );
}
