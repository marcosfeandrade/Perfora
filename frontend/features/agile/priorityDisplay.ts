export const PRIORITY_DISPLAY: Record<
  string,
  { emoji: string; label: string }
> = {
  low: { emoji: "🟢", label: "Baixa" },
  normal: { emoji: "🟡", label: "Normal" },
  high: { emoji: "🟠", label: "Alta" },
  urgent: { emoji: "🔴", label: "Urgente" },
};

export function getPriorityDisplay(priority: string | null | undefined) {
  if (!priority) return null;
  return PRIORITY_DISPLAY[priority] ?? null;
}
