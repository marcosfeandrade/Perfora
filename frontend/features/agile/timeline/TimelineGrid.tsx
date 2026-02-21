"use client";

import type { Card } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TimelineRow } from "./TimelineRow";
import {
  generateDateRange,
  getTodayPosition,
  type TimelineMode,
} from "./utils";

type CardWithBoard = Card & { boardName?: string; columnName?: string };

type TimelineGridProps = {
  cards: CardWithBoard[];
  mode: TimelineMode;
  centerDate: Date;
  dayWidth: number;
  onDatesChange: (cardId: string, startDate: Date, dueDate: Date) => Promise<void>;
  onCardClick?: (card: Card) => void;
};

export function TimelineGrid({
  cards,
  mode,
  centerDate,
  dayWidth,
  onDatesChange,
  onCardClick,
}: TimelineGridProps) {
  const { start, end, days } = generateDateRange(mode, centerDate);
  const totalWidth = days.length * dayWidth;
  const todayPosition = getTodayPosition(start, end, totalWidth);

  return (
    <div className="flex flex-col min-h-0">
      <div
        className="flex border-b border-border bg-muted/30 shrink-0"
        style={{ width: 256 + totalWidth, minWidth: "100%" }}
      >
        <div className="w-64 shrink-0 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">Tarefa</p>
        </div>
        <div className="flex relative shrink-0" style={{ width: totalWidth }}>
          {days.map((d) => (
            <div
              key={d.toISOString()}
              className="shrink-0 border-r border-border last:border-r-0"
              style={{ width: dayWidth }}
            >
              <p className="text-xs text-muted-foreground text-center py-1">
                {d.getDate()}
              </p>
              <p className="text-[10px] text-muted-foreground/70 text-center">
                {d.toLocaleDateString("pt-BR", { weekday: "short" })}
              </p>
            </div>
          ))}
          {todayPosition !== null && (
            <div
              className="absolute top-0 bottom-0 w-px bg-primary/60 z-10 pointer-events-none"
              style={{ left: todayPosition }}
            />
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        <div
          className="relative"
          style={{ minWidth: 256 + totalWidth, width: "max-content" }}
        >
          {todayPosition !== null && (
            <div
              className="absolute top-0 bottom-0 w-px bg-primary/60 z-[1] pointer-events-none"
              style={{ left: 256 + todayPosition }}
            />
          )}
          {cards.map((card) => (
            <TimelineRow
              key={card.id}
              card={card}
              mode={mode}
              centerDate={centerDate}
              dayWidth={dayWidth}
              totalWidth={totalWidth}
              onDatesChange={onDatesChange}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
