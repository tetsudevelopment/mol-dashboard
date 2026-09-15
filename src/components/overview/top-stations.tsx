import { formatNumber } from "@/lib/format";

export interface TopStationRow {
  id: string;
  name: string;
  rentals: number;
}

/**
 * Horizontal bars rather than a pie: ten slices are unreadable as angles, and
 * the question here is ranking and relative size, which length answers better.
 *
 * Label and count sit ABOVE the bar rather than beside it, because this panel
 * lives in the narrow third of the Overview grid — inline, the bar would be
 * squeezed into a few dozen pixels and stop encoding anything.
 */
export function TopStations({ rows }: { rows: TopStationRow[] }) {
  if (rows.length === 0) {
    return (
      <p
        data-testid="overview-top-stations-empty"
        className="py-6 text-center text-xs text-zinc-500"
      >
        Sin alquileres en el período seleccionado.
      </p>
    );
  }

  const max = Math.max(...rows.map((r) => r.rentals));

  return (
    <ol className="flex flex-col gap-3" data-testid="overview-top-stations">
      {rows.map((row, index) => (
        <li key={row.id} className="text-xs">
          <div className="flex items-baseline justify-between gap-2">
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span className="w-4 shrink-0 text-right font-mono text-zinc-400">
                {index + 1}
              </span>
              <span className="truncate font-medium" title={row.name}>
                {row.name}
              </span>
            </span>
            <span className="shrink-0 font-mono tabular-nums text-zinc-500">
              {formatNumber(row.rentals)}
            </span>
          </div>
          <span className="mt-1 block h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${String((row.rentals / max) * 100)}%`,
                backgroundColor: "var(--chart-revenue)",
              }}
            />
          </span>
        </li>
      ))}
    </ol>
  );
}
