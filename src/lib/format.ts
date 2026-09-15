const COMPACT = new Intl.NumberFormat("es-CO", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Full amount for headline figures — COP has no meaningful cents. */
export function formatCurrency(amount: number, currency = "COP"): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Short form for chart axes, where a full COP figure would not fit. */
export function formatCompactCurrency(amount: number): string {
  return `$${COMPACT.format(amount)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CO").format(value);
}

/** `2026-09-15` → `15 sep`, for the day axis. */
export function formatDayLabel(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}
