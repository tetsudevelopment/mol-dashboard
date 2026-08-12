/**
 * Bridges `<input type="datetime-local">` and the API's ISO-8601-with-offset
 * contract.
 *
 * A datetime-local value is NAIVE — "2026-08-11T14:30" with no zone. Sending it
 * as-is would let the server interpret it in ITS timezone, silently shifting a
 * coupon's validity window by hours. `new Date(naive)` parses it in the
 * browser's zone, which is the operator's intent, and `toISOString()` then
 * carries the correct instant.
 */
export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

/**
 * The inverse, for populating an edit form. `toISOString()` is UTC, so the
 * naive string has to be built from the LOCAL components — otherwise editing a
 * coupon without touching the dates would move them by the UTC offset.
 */
export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** Short human-readable date+time in the viewer's locale, for table cells. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
