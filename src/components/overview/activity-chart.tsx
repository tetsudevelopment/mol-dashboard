import type { DailyPoint } from "@/api/endpoints/admin-overview";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDayLabel,
  formatNumber,
} from "@/lib/format";

/**
 * Revenue and rental volume on one canvas: bars carry the money (left axis),
 * the line carries the count (right axis). Two axes because the units are
 * unrelated — a shared scale would flatten whichever series is smaller.
 *
 * Hand-drawn SVG rather than a charting dependency: two marks and two axes do
 * not justify shipping a library to every operator's browser.
 */

const VIEW_W = 840;
const VIEW_H = 280;
const PAD = { top: 16, right: 52, bottom: 34, left: 64 };
const PLOT_W = VIEW_W - PAD.left - PAD.right;
const PLOT_H = VIEW_H - PAD.top - PAD.bottom;

const REVENUE_COLOR = "var(--chart-revenue)";
const RENTALS_COLOR = "var(--chart-rentals)";
const GRID_STEPS = 4;

export function ActivityChart({
  series,
  currency,
}: {
  series: DailyPoint[];
  currency: string;
}) {
  if (series.length === 0) return null;

  // A refund can push a day negative, so the money axis spans min..max with
  // zero always included — otherwise the baseline would drift off the plot.
  const revenueMax = Math.max(0, ...series.map((d) => d.revenue));
  const revenueMin = Math.min(0, ...series.map((d) => d.revenue));
  const revenueSpan = revenueMax - revenueMin || 1;
  const rentalsMax = Math.max(1, ...series.map((d) => d.rentals));

  const slot = PLOT_W / series.length;
  const barWidth = Math.max(2, slot * 0.55);

  const xOf = (index: number) => PAD.left + (index + 0.5) * slot;
  const yRevenue = (value: number) =>
    PAD.top + PLOT_H - ((value - revenueMin) / revenueSpan) * PLOT_H;
  const yRentals = (value: number) =>
    PAD.top + PLOT_H - (value / rentalsMax) * PLOT_H;
  const zeroY = yRevenue(0);

  const linePath = series
    .map((d, i) => `${i === 0 ? "M" : "L"}${String(xOf(i))} ${String(yRentals(d.rentals))}`)
    .join(" ");

  // Thin the day labels so they never collide at a 30-day window.
  const labelStep = Math.ceil(series.length / 8);

  return (
    <figure className="m-0">
      <figcaption className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        <LegendItem color={REVENUE_COLOR} label="Ingresos aprobados" shape="bar" />
        <LegendItem color={RENTALS_COLOR} label="Alquileres iniciados" shape="line" />
      </figcaption>

      <svg
        viewBox={`0 0 ${String(VIEW_W)} ${String(VIEW_H)}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Ingresos y alquileres por día durante los últimos ${String(series.length)} días`}
        data-testid="overview-activity-chart"
      >
        {Array.from({ length: GRID_STEPS + 1 }, (_, step) => {
          const ratio = step / GRID_STEPS;
          const y = PAD.top + PLOT_H - ratio * PLOT_H;
          return (
            <g key={step}>
              <line
                x1={PAD.left}
                x2={PAD.left + PLOT_W}
                y1={y}
                y2={y}
                className="stroke-zinc-200 dark:stroke-zinc-800"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-zinc-500 text-[10px]"
              >
                {formatCompactCurrency(revenueMin + ratio * revenueSpan)}
              </text>
              <text
                x={PAD.left + PLOT_W + 8}
                y={y + 3}
                textAnchor="start"
                className="fill-zinc-500 text-[10px]"
              >
                {formatNumber(Math.round(ratio * rentalsMax))}
              </text>
            </g>
          );
        })}

        <line
          x1={PAD.left}
          x2={PAD.left + PLOT_W}
          y1={zeroY}
          y2={zeroY}
          className="stroke-zinc-300 dark:stroke-zinc-700"
          strokeWidth={1}
        />

        {series.map((point, index) => {
          const y = yRevenue(point.revenue);
          const top = Math.min(y, zeroY);
          const height = Math.max(1, Math.abs(zeroY - y));
          return (
            <rect
              key={point.date}
              x={xOf(index) - barWidth / 2}
              y={top}
              width={barWidth}
              height={height}
              rx={2}
              fill={REVENUE_COLOR}
              opacity={0.85}
            >
              <title>
                {`${formatDayLabel(point.date)} · ${formatCurrency(point.revenue, currency)} · ${formatNumber(point.rentals)} alquileres`}
              </title>
            </rect>
          );
        })}

        <path
          d={linePath}
          fill="none"
          stroke={RENTALS_COLOR}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {series.map((point, index) => (
          <circle
            key={point.date}
            cx={xOf(index)}
            cy={yRentals(point.rentals)}
            r={3}
            fill={RENTALS_COLOR}
          >
            <title>
              {`${formatDayLabel(point.date)} · ${formatNumber(point.rentals)} alquileres`}
            </title>
          </circle>
        ))}

        {series.map((point, index) =>
          index % labelStep === 0 ? (
            <text
              key={point.date}
              x={xOf(index)}
              y={VIEW_H - 12}
              textAnchor="middle"
              className="fill-zinc-500 text-[10px]"
            >
              {formatDayLabel(point.date)}
            </text>
          ) : null,
        )}
      </svg>
    </figure>
  );
}

function LegendItem({
  color,
  label,
  shape,
}: {
  color: string;
  label: string;
  shape: "bar" | "line";
}) {
  return (
    <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
      <span
        aria-hidden
        className={shape === "bar" ? "h-3 w-2.5 rounded-sm" : "h-0.5 w-4 rounded-full"}
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
