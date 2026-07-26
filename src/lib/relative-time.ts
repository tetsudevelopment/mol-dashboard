/**
 * Coarse "hace Xm/Xh/Xd" formatter for timestamps like a cabinet's
 * `last_seen_at`. No date library in this project (see package.json) — this
 * stays intentionally simple and Spanish-only, matching the rest of the
 * dashboard's UI copy.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  if (diffMs < 0) return "recién";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "hace instantes";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}
