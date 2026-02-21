"use client";

import { memo, useCallback } from "react";
import type { Card } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TimelineBar } from "./TimelineBar";
import {
  calculateBarPosition,
  generateDateRange,
  type TimelineMode,
} from "./utils";

type CardWithBoard = Card & { boardName?: string; columnName?: string };

function normalizeAssignees(assignees: Card["assignees"]) {
  return (assignees ?? []).map((a) => {
    const u = a as { user?: { id: string; email: string; name: string | null } };
    return u.user ?? a;
  });
}

type TimelineRowProps = {
  card: CardWithBoard;
  mode: TimelineMode;
  centerDate: Date;
  dayWidth: number;
  totalWidth: number;
  onDatesChange: (cardId: string, startDate: Date, dueDate: Date) => Promise<void>;
  onCardClick?: (card: Card) => void;
};

export const TimelineRow = memo(function TimelineRow({
  card,
  mode,
  centerDate,
  dayWidth,
  totalWidth,
  onDatesChange,
  onCardClick,
}: TimelineRowProps) {
  const { start, end } = generateDateRange(mode, centerDate);
  const assignees = normalizeAssignees(card.assignees);
  const labels = (card.labels as string[]) ?? [];

  const dueDate = card.dueDate ? new Date(card.dueDate) : null;
  const startDate = card.startDate
    ? new Date(card.startDate)
    : dueDate
      ? new Date(dueDate)
      : null;

  if (!startDate || !dueDate) return null;
  if (startDate > dueDate) return null;

  const handleBarDatesChange = useCallback(
    (s: Date, d: Date) => onDatesChange(card.id, s, d),
    [card.id, onDatesChange]
  );

  const barEnd = new Date(dueDate);
  barEnd.setHours(23, 59, 59, 999);
  const { left, width } = calculateBarPosition(
    startDate,
    barEnd,
    start,
    end,
    totalWidth
  );

  return (
    <div
      className={cn(
        "flex items-center border-b border-border min-h-[52px] shrink-0",
        "hover:bg-muted/30 transition-colors"
      )}
    >
      <div
        className="w-64 shrink-0 flex items-center gap-2 px-3 py-2 cursor-pointer"
        onClick={() => onCardClick?.(card)}
      >
        <p className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
          {card.title}
        </p>
        <div className="flex items-center gap-1 shrink-0">
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
        </div>
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {labels.slice(0, 2).map((l) => (
              <Badge
                key={l}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4"
              >
                {l}
              </Badge>
            ))}
            {labels.length > 2 && (
              <span className="text-[10px] text-muted-foreground">
                +{labels.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 relative h-8 px-2">
        <TimelineBar
          cardId={card.id}
          title={card.title}
          startDate={startDate}
          dueDate={dueDate}
          assignees={assignees}
          labels={labels}
          left={left}
          width={width}
          dayWidth={dayWidth}
          rangeStart={start}
          onDatesChange={handleBarDatesChange}
        />
      </div>
    </div>
  );
});
