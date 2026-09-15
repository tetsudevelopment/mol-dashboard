"use client";

import { useState } from "react";

import {
  OVERVIEW_PERIODS,
  type OverviewPeriod,
} from "@/api/endpoints/admin-overview";
import { PageHeader } from "@/components/page-header";
import { ActivityChart } from "@/components/overview/activity-chart";
import { StatTile } from "@/components/overview/stat-tile";
import {
  TopStations,
  type TopStationRow,
} from "@/components/overview/top-stations";
import { ErrorBanner } from "@/components/ui/error-banner";
import { cn } from "@/lib/cn";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useOverview } from "@/queries/admin-overview.queries";
import { useStations } from "@/queries/admin-stations.queries";

export default function OverviewPage() {
  const [days, setDays] = useState<OverviewPeriod>(7);

  const overviewQuery = useOverview(days);
  const stationsQuery = useStations();

  const stats = overviewQuery.data;
  const loading = overviewQuery.isPending;

  const stations = stationsQuery.data?.stations ?? [];
  const topRows: TopStationRow[] = (stats?.topStations ?? []).map((row) => ({
    id: row.stationId,
    name:
      stations.find((s) => s.id === row.stationId)?.name ??
      `${row.stationId.slice(0, 8)}…`,
    rentals: row.rentals,
  }));

  const currency = stats?.totals.currency ?? "COP";
  const averageTicket =
    stats && stats.totals.approvedPayments > 0
      ? stats.totals.revenue / stats.totals.approvedPayments
      : 0;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Ingresos y alquileres del período, y los gabinetes con más movimiento."
        actions={
          <div
            role="group"
            aria-label="Período"
            data-testid="overview-period-filter"
            className="flex rounded-md border border-zinc-300 p-0.5 dark:border-zinc-700"
          >
            {OVERVIEW_PERIODS.map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setDays(period)}
                aria-pressed={days === period}
                data-testid={`overview-period-${String(period)}`}
                className={cn(
                  "rounded px-3 py-1 text-xs font-medium transition-colors",
                  days === period
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900",
                )}
              >
                {period} días
              </button>
            ))}
          </div>
        }
      />

      <ErrorBanner error={overviewQuery.error} testId="overview-error" />

      {stats && stats.skipped > 0 ? (
        <p
          data-testid="overview-skipped"
          className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        >
          {stats.skipped === 1
            ? "Se ignoró 1 registro que no coincide"
            : `Se ignoraron ${formatNumber(stats.skipped)} registros que no coinciden`}{" "}
          con los esquemas del dashboard, así que no está contado en estas cifras.
          Suele significar que la API agregó un valor nuevo a un enum: revisá{" "}
          <code>src/validators/</code>.
        </p>
      ) : null}

      {stats?.truncated ? (
        <p
          data-testid="overview-truncated"
          className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        >
          El período tiene más movimiento del que se puede agregar desde el navegador,
          así que estas cifras son parciales. Para números exactos hace falta un endpoint
          de agregación en el backend.
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Ingresos"
          value={loading ? "—" : formatCurrency(stats?.totals.revenue ?? 0, currency)}
          hint="Pagos aprobados, netos de reembolsos"
          testId="overview-stat-revenue"
        />
        <StatTile
          label="Alquileres"
          value={loading ? "—" : formatNumber(stats?.totals.rentals ?? 0)}
          hint={
            loading
              ? undefined
              : `${formatNumber(stats?.totals.completedRentals ?? 0)} completados`
          }
          testId="overview-stat-rentals"
        />
        <StatTile
          label="Pagos aprobados"
          value={loading ? "—" : formatNumber(stats?.totals.approvedPayments ?? 0)}
          hint="Transacciones confirmadas"
          testId="overview-stat-payments"
        />
        <StatTile
          label="Ticket promedio"
          value={loading ? "—" : formatCurrency(averageTicket, currency)}
          hint="Ingresos / pagos aprobados"
          testId="overview-stat-ticket"
        />
      </section>

      {/* The ranking sits beside the chart, not under it: below the fold it was
          easy to miss entirely. Stacks back to one column under lg. */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-1 text-sm font-semibold">Actividad diaria</h2>
          <p className="mb-4 text-xs text-zinc-500">
            Últimos {days} días, en la zona horaria de este navegador.
          </p>
          {loading ? (
            <p className="py-16 text-center text-xs text-zinc-500">Cargando…</p>
          ) : (
            <ActivityChart series={stats?.series ?? []} currency={currency} />
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-1 text-sm font-semibold">Top 10 gabinetes</h2>
          <p className="mb-4 text-xs text-zinc-500">
            Por alquileres iniciados en los últimos {days} días.
          </p>
          {loading ? (
            <p className="py-10 text-center text-xs text-zinc-500">Cargando…</p>
          ) : (
            <TopStations rows={topRows} />
          )}
        </section>
      </div>
    </>
  );
}
