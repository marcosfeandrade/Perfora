export type TimelineMode = "week" | "month";

export function generateDateRange(
  mode: TimelineMode,
  centerDate: Date
): { start: Date; end: Date; days: Date[] } {
  const start = new Date(centerDate);
  const end = new Date(centerDate);

  if (mode === "week") {
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  }

  const days: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return { start, end, days };
}

export function calculateBarPosition(
  barStart: Date,
  barEnd: Date,
  rangeStart: Date,
  rangeEnd: Date,
  totalWidth: number
): { left: number; width: number } {
  const rangeMs = rangeEnd.getTime() - rangeStart.getTime();
  const barStartMs = Math.max(barStart.getTime(), rangeStart.getTime());
  const barEndMs = Math.min(barEnd.getTime(), rangeEnd.getTime());

  if (barStartMs >= barEndMs) return { left: 0, width: 0 };

  const left = ((barStartMs - rangeStart.getTime()) / rangeMs) * totalWidth;
  const width = ((barEndMs - barStartMs) / rangeMs) * totalWidth;

  return { left: Math.max(0, left), width: Math.min(width, totalWidth - left) };
}

export function calculateBarWidth(
  startDate: Date,
  endDate: Date,
  rangeStart: Date,
  rangeEnd: Date,
  totalWidth: number
): number {
  const rangeMs = rangeEnd.getTime() - rangeStart.getTime();
  const barStartMs = Math.max(startDate.getTime(), rangeStart.getTime());
  const barEndMs = Math.min(endDate.getTime(), rangeEnd.getTime());

  if (barStartMs >= barEndMs) return 0;

  return ((barEndMs - barStartMs) / rangeMs) * totalWidth;
}

export function getTodayPosition(
  rangeStart: Date,
  rangeEnd: Date,
  totalWidth: number
): number | null {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  if (today < rangeStart || today > rangeEnd) return null;

  const rangeMs = rangeEnd.getTime() - rangeStart.getTime();
  const todayMs = today.getTime() - rangeStart.getTime();
  return (todayMs / rangeMs) * totalWidth;
}

export function isOverdue(dueDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function isNearDue(dueDate: Date, daysThreshold = 3): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= daysThreshold;
}

export function hasPriorityLabel(labels: string[] | null | undefined): boolean {
  if (!labels?.length) return false;
  const priorityKeywords = ["prioritária", "prioridade", "urgente", "alta", "critical", "high"];
  return labels.some((l) =>
    priorityKeywords.some((k) => l.toLowerCase().includes(k))
  );
}
