"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { hasPriorityLabel, isNearDue, isOverdue } from "./utils";

type TimelineBarProps = {
  cardId: string;
  title: string;
  startDate: Date;
  dueDate: Date;
  assignees: { id: string; name: string | null; email: string }[];
  labels: string[];
  left: number;
  width: number;
  onDatesChange: (startDate: Date, dueDate: Date) => Promise<void>;
  dayWidth: number;
  rangeStart: Date;
};

export const TimelineBar = memo(function TimelineBar({
  cardId,
  title,
  startDate,
  dueDate,
  assignees,
  labels,
  left,
  width,
  onDatesChange,
  dayWidth,
  rangeStart,
}: TimelineBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<"left" | "right" | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const dragStartRef = useRef<{
    initialX: number;
    startDate: Date;
    dueDate: Date;
  } | null>(null);
  const resizeStartRef = useRef<{
    initialX: number;
    startDate: Date;
    dueDate: Date;
    side: "left" | "right";
  } | null>(null);
  const lastDeltaXRef = useRef(0);

  const isPriority = hasPriorityLabel(labels);
  const overdue = isOverdue(dueDate);
  const nearDue = isNearDue(dueDate);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const tooltipText = [
    title,
    `Início: ${formatDate(startDate)} · Vencimento: ${formatDate(dueDate)}`,
    assignees.length > 0
      ? `Responsáveis: ${assignees.map((a) => a.name || a.email).join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).dataset.resize) return;
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        initialX: e.clientX,
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
      };
    },
    [startDate, dueDate]
  );

  const handleResizeMouseDown = useCallback(
    (side: "left" | "right") => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(side);
      resizeStartRef.current = {
        initialX: e.clientX,
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
        side,
      };
    },
    [startDate, dueDate]
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.initialX;
      lastDeltaXRef.current = dx;
      setDragOffsetX(dx);
    }
    if (resizeStartRef.current) {
      lastDeltaXRef.current = e.clientX - resizeStartRef.current.initialX;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    const dx = lastDeltaXRef.current;
    lastDeltaXRef.current = 0;

    if (isDragging && dragStartRef.current) {
      const daysMoved = Math.round(dx / dayWidth);
      if (daysMoved !== 0) {
        const newStart = new Date(dragStartRef.current.startDate);
        newStart.setDate(newStart.getDate() + daysMoved);
        const newDue = new Date(dragStartRef.current.dueDate);
        newDue.setDate(newDue.getDate() + daysMoved);
        onDatesChange(newStart, newDue);
      }
    }
    if (isResizing && resizeStartRef.current) {
      const daysDelta = Math.round(dx / dayWidth);
      if (daysDelta !== 0) {
        const { startDate: s, dueDate: d, side } = resizeStartRef.current;
        if (side === "left") {
          const newStart = new Date(s);
          newStart.setDate(newStart.getDate() + daysDelta);
          if (newStart < d) onDatesChange(newStart, new Date(d));
        } else {
          const newDue = new Date(d);
          newDue.setDate(newDue.getDate() + daysDelta);
          if (newDue > s) onDatesChange(new Date(s), newDue);
        }
      }
    }

    setIsDragging(false);
    setIsResizing(null);
    setDragOffsetX(0);
    dragStartRef.current = null;
    resizeStartRef.current = null;
  }, [isDragging, isResizing, dayWidth, onDatesChange]);

  useEffect(() => {
    if (!isDragging && !isResizing) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  if (width < 4) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      title={tooltipText}
      onMouseDown={handleMouseDown}
      className={cn(
        "absolute h-6 rounded-full cursor-grab active:cursor-grabbing",
        "bg-muted-foreground/20 hover:shadow-md",
        isPriority && "bg-primary/30",
        nearDue && !overdue && "ring-1 ring-warning/50",
        overdue && "ring-1 ring-destructive/50"
      )}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        minWidth: "8px",
        transform: isDragging ? `translateX(${dragOffsetX}px)` : undefined,
        willChange: isDragging ? "transform" : undefined,
      }}
    >
      <div
        data-resize="left"
        onMouseDown={handleResizeMouseDown("left")}
        className="absolute left-0 top-0 w-2 h-full cursor-ew-resize rounded-l-full hover:bg-foreground/10"
      />
      <div
        data-resize="right"
        onMouseDown={handleResizeMouseDown("right")}
        className="absolute right-0 top-0 w-2 h-full cursor-ew-resize rounded-r-full hover:bg-foreground/10"
      />
    </div>
  );
});
