import { StatusBadge } from "@/components/status-badge";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  isCabinetEnrolled,
  isCabinetOnline,
  type CabinetDevice,
} from "@/validators/cabinet-device.schema";

/**
 * Renders the device_id + enrollment/online state for a station's cabinet
 * binding. `device` is null when the station has no cabinet device
 * pre-registered yet. Shared between the stations table and the station
 * state modal so both "list" and "detail" views agree on the wording.
 */
export function CabinetDeviceStatus({ device }: { device: CabinetDevice | null }) {
  if (!device) {
    return <span className="text-xs text-zinc-400">Sin gabinete asignado</span>;
  }

  if (!isCabinetEnrolled(device)) {
    return (
      <div data-testid="cabinet-device-status" className="space-y-1">
        <div className="font-mono text-xs font-medium">{device.device_id}</div>
        <StatusBadge variant="warning">Pendiente</StatusBadge>
      </div>
    );
  }

  const online = isCabinetOnline(device);

  return (
    <div data-testid="cabinet-device-status" className="space-y-1">
      <div className="font-mono text-xs font-medium">{device.device_id}</div>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge variant={online ? "success" : "neutral"}>
          {online ? "En línea" : "Fuera de línea"}
        </StatusBadge>
        {device.model ? <span className="text-xs text-zinc-500">{device.model}</span> : null}
      </div>
      <div className="text-[10px] text-zinc-500">
        {device.last_seen_at
          ? `Visto ${formatRelativeTime(device.last_seen_at)}`
          : "Nunca reportó actividad"}
      </div>
    </div>
  );
}
