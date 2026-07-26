"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { StatusBadge } from "@/components/status-badge";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  useEjectBattery,
  useEjectCommandStatus,
} from "@/queries/admin-cabinet-devices.queries";
import type { CabinetDevice } from "@/validators/cabinet-device.schema";

/**
 * Queues an eject through the SAME mechanism the cabinet app already polls
 * for real rentals (GET /devices/me/pending-dispense -> POST
 * /devices/me/dispense-ack — see AdminCabinetDevicesService.eject in
 * moltech_api). This is an ops/test action, not the paid-rental flow — it
 * does not create a rental.
 *
 * No battery/slot picker: the poll-driven flow never lets the caller target
 * a specific battery (the cabinet always self-selects, exactly like a real
 * rental dispense — see docs/API_CONTRACT.md §7.10), so offering that
 * control here would be misleading.
 *
 * The POST only confirms the command was QUEUED. This modal then polls
 * GET .../eject-commands/{commandId} every ~2.5s (matching the cabinet's own
 * poll cadence) until the cabinet acks it (dispensed/failed) or its 2-minute
 * TTL elapses (expired).
 */
export function EjectBatteryModal({
  device,
  stationName,
  open,
  onClose,
}: {
  device: CabinetDevice | null;
  stationName: string;
  open: boolean;
  onClose: () => void;
}) {
  const eject = useEjectBattery();
  const commandId = eject.data?.command_id;
  const status = useEjectCommandStatus(device?.id, commandId);

  function handleClose() {
    eject.reset();
    onClose();
  }

  async function handleEject() {
    if (!device) return;
    await eject.mutateAsync({ id: device.id, input: {} });
  }

  const isTerminal =
    status.data?.status === "dispensed" ||
    status.data?.status === "failed" ||
    status.data?.status === "expired";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Expulsar batería — ${stationName}`}
      width="sm"
    >
      {device ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Encola un eject en el gabinete{" "}
            <span className="font-mono">{device.device_id}</span>. Acción de
            operación/testing — no crea un alquiler ni queda atada a ningún
            usuario. El gabinete elige automáticamente la mejor batería
            elegible; no se puede seleccionar una específica.
          </p>

          {eject.data ? (
            <EjectStatusPanel status={status.data?.status ?? "pending"} statusData={status.data} />
          ) : null}

          <ErrorBanner error={eject.error ?? status.error} testId="eject-error" />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClose} disabled={eject.isPending}>
              {eject.data ? "Cerrar" : "Cancelar"}
            </Button>
            {eject.data ? (
              isTerminal ? (
                <Button variant="secondary" onClick={() => eject.reset()} data-testid="eject-again">
                  Expulsar otra
                </Button>
              ) : null
            ) : (
              <Button
                variant="danger"
                onClick={handleEject}
                disabled={eject.isPending}
                data-testid="eject-confirm"
              >
                {eject.isPending ? "Encolando…" : "Expulsar"}
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function EjectStatusPanel({
  status,
  statusData,
}: {
  status: "pending" | "dispensed" | "failed" | "expired";
  statusData: { dispensed_battery_id: string | null; dispensed_at: string | null } | undefined;
}) {
  if (status === "dispensed") {
    return (
      <div
        data-testid="eject-result"
        className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
      >
        <div className="flex items-center gap-2 font-medium">
          <StatusBadge variant="success">Expulsada</StatusBadge>
        </div>
        <div className="mt-1 space-y-0.5 font-mono">
          <div>battery_id: {statusData?.dispensed_battery_id}</div>
          {statusData?.dispensed_at ? (
            <div className="font-sans text-emerald-700/80 dark:text-emerald-300/80">
              {formatRelativeTime(statusData.dispensed_at)}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div
        data-testid="eject-result"
        className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-800 dark:bg-red-950 dark:text-red-300"
      >
        <StatusBadge variant="error">Falló</StatusBadge>
        <div className="mt-1 font-sans">
          El gabinete no pudo expulsar la batería. Revisá el estado del hardware.
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div
        data-testid="eject-result"
        className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300"
      >
        <StatusBadge variant="warning">Expiró</StatusBadge>
        <div className="mt-1 font-sans">
          El comando expiró sin que el gabinete respondiera. Verificá que
          esté en línea e intentá de nuevo.
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="eject-result"
      className="rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:bg-sky-950 dark:text-sky-300"
    >
      <StatusBadge variant="info">En cola</StatusBadge>
      <div className="mt-1 font-sans">
        El gabinete va a ejecutar el eject en los próximos segundos.
      </div>
    </div>
  );
}
