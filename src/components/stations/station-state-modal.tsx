"use client";

import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/status-badge";
import { ErrorBanner } from "@/components/ui/error-banner";
import { CabinetDeviceStatus } from "@/components/stations/cabinet-device-status";
import { useStationState } from "@/queries/admin-stations.queries";
import type { CabinetDevice } from "@/validators/cabinet-device.schema";

const STATUS_VARIANT = {
  available: "success",
  rented: "info",
  charging: "warning",
  damaged: "error",
  retired: "neutral",
} as const;

export function StationStateModal({
  stationId,
  open,
  cabinetDevice = null,
  onClose,
}: {
  stationId: string | null;
  open: boolean;
  cabinetDevice?: CabinetDevice | null;
  onClose: () => void;
}) {
  const { data, error, isPending } = useStationState(open && stationId ? stationId : undefined);

  return (
    <Modal open={open} onClose={onClose} title="Estado del gabinete" width="lg">
      <div data-testid="station-state-content">
        {isPending && open ? (
          <p className="text-sm text-zinc-500">Cargando estado…</p>
        ) : error ? (
          <ErrorBanner error={error} />
        ) : data ? (
          <div className="space-y-4">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{data.station.name}</h3>
                <p className="text-xs text-zinc-500">
                  {data.station.city} — {data.station.address}
                </p>
              </div>
              <StatusBadge
                variant={
                  data.station.status === "online"
                    ? "success"
                    : data.station.status === "maintenance"
                      ? "warning"
                      : "error"
                }
              >
                {data.station.status}
              </StatusBadge>
            </header>

            <section
              data-testid="station-state-cabinet-device"
              className="rounded-md border border-dashed border-zinc-300 px-3 py-2 dark:border-zinc-700"
            >
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Gabinete físico
              </h4>
              <CabinetDeviceStatus device={cabinetDevice} />
            </section>

            <section
              data-testid="station-state-summary"
              className="grid grid-cols-6 gap-2 text-center text-xs"
            >
              <SummaryCard label="Total" value={data.summary.total} />
              <SummaryCard
                label="Available"
                value={data.summary.available}
                tone="success"
              />
              <SummaryCard label="Rented" value={data.summary.rented} tone="info" />
              <SummaryCard label="Charging" value={data.summary.charging} tone="warning" />
              <SummaryCard label="Damaged" value={data.summary.damaged} tone="error" />
              <SummaryCard label="Retired" value={data.summary.retired} />
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Power banks en el gabinete ({data.power_banks.length})
              </h4>
              {data.power_banks.length === 0 ? (
                <p
                  data-testid="station-state-power-banks-empty"
                  className="rounded-md border border-dashed border-zinc-300 px-3 py-4 text-center text-xs text-zinc-500 dark:border-zinc-700"
                >
                  Este gabinete no tiene baterías asignadas todavía.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                  {data.power_banks.map((pb) => (
                    <li
                      key={pb.id}
                      data-testid="station-state-power-bank-row"
                      className="flex items-center justify-between px-3 py-2 text-xs"
                    >
                      <div>
                        <span className="font-mono font-medium">{pb.code}</span>
                        {pb.model ? (
                          <span className="ml-2 text-zinc-500">{pb.model}</span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500">{pb.battery_level}%</span>
                        <StatusBadge variant={STATUS_VARIANT[pb.status]}>
                          {pb.status}
                        </StatusBadge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "info" | "warning" | "error";
}) {
  const toneClass = {
    neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    info: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    error: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  }[tone];
  return (
    <div className={`rounded-md px-2 py-1.5 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-wide">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
