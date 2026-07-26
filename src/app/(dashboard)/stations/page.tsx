"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, RefreshCw, Unlink, Zap } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StationForm } from "@/components/stations/station-form";
import { StationStateModal } from "@/components/stations/station-state-modal";
import { CabinetDeviceStatus } from "@/components/stations/cabinet-device-status";
import { EjectBatteryModal } from "@/components/stations/eject-battery-modal";
import { ApiClientError } from "@/api/types";
import {
  useStations,
  useCreateStation,
  useUpdateStation,
  useDeleteStation,
} from "@/queries/admin-stations.queries";
import {
  useCabinetDevices,
  useCreateCabinetDevice,
  useReleaseCabinetDevice,
  useDeleteCabinetDevice,
} from "@/queries/admin-cabinet-devices.queries";
import {
  MAX_POWER_BANKS_PER_STATION,
  isStationFull,
  type CreateStationInput,
  type Station,
} from "@/validators/station.schema";
import type { CabinetDevice } from "@/validators/cabinet-device.schema";

/** Pending confirmation for a destructive edit-form device change (clear or replace). */
interface DeviceChangeConfirm {
  kind: "clear" | "replace";
  station: Station;
  currentDevice: CabinetDevice;
  newDeviceId?: string;
}

function describeError(err: unknown): string | null {
  if (!err) return null;
  if (err instanceof ApiClientError) return `[${err.code}] ${err.message}`;
  if (err instanceof Error) return err.message;
  return String(err);
}

export default function StationsPage() {
  const { data, error, isPending } = useStations();
  const createMutation = useCreateStation();
  const updateMutation = useUpdateStation();
  const deleteMutation = useDeleteStation();

  const { data: devices } = useCabinetDevices();
  const createDeviceMutation = useCreateCabinetDevice();
  const releaseDeviceMutation = useReleaseCabinetDevice();
  const deleteDeviceMutation = useDeleteCabinetDevice();

  const deviceByStation = new Map((devices ?? []).map((d) => [d.station_id, d]));

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Station | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Station | null>(null);
  const [stateTarget, setStateTarget] = useState<Station | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<CabinetDevice | null>(null);
  const [unbindTarget, setUnbindTarget] = useState<CabinetDevice | null>(null);
  const [ejectTarget, setEjectTarget] = useState<CabinetDevice | null>(null);
  const [deviceChangeConfirm, setDeviceChangeConfirm] = useState<DeviceChangeConfirm | null>(
    null,
  );

  const columns: Column<Station>[] = [
    {
      key: "name",
      header: "Nombre",
      render: (s) => (
        <div>
          <div className="font-medium">{s.name}</div>
          <div className="text-xs text-zinc-500">{s.city}</div>
        </div>
      ),
    },
    {
      key: "address",
      header: "Dirección",
      render: (s) => <span className="text-xs">{s.address}</span>,
    },
    {
      key: "rate",
      header: "Tarifa",
      render: (s) => (
        <span className="font-mono text-xs">
          {s.hourly_rate} {s.currency}/h
        </span>
      ),
    },
    {
      key: "capacity",
      header: "Capacidad",
      render: (s) => <span className="text-xs">{s.total_capacity}</span>,
    },
    {
      key: "power-banks-count",
      header: "Baterías",
      render: (s) => {
        const full = isStationFull(s);
        return (
          <span
            data-testid={`station-pb-count-${s.id}`}
            className={
              full
                ? "inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300"
                : s.power_banks_count >= MAX_POWER_BANKS_PER_STATION - 2
                  ? "inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            }
          >
            {s.power_banks_count}/{MAX_POWER_BANKS_PER_STATION}
            {full ? " · LLENO" : ""}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <StatusBadge
          variant={
            s.status === "online" ? "success" : s.status === "maintenance" ? "warning" : "error"
          }
        >
          {s.status}
        </StatusBadge>
      ),
    },
    {
      key: "cabinet-device",
      header: "Gabinete",
      render: (s) => {
        const device = deviceByStation.get(s.id) ?? null;
        return (
          <div className="flex items-start justify-between gap-2">
            <CabinetDeviceStatus device={device} />
            {device ? (
              <div className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEjectTarget(device)}
                  data-testid={`cabinet-eject-btn-${device.id}`}
                  aria-label={`Expulsar batería de ${s.name}`}
                >
                  <Zap className="size-3.5" aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReleaseTarget(device)}
                  data-testid={`cabinet-release-btn-${device.id}`}
                  aria-label={`Re-enrolar gabinete de ${s.name}`}
                >
                  <RefreshCw className="size-3.5" aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setUnbindTarget(device)}
                  data-testid={`cabinet-unbind-btn-${device.id}`}
                  aria-label={`Quitar device del gabinete de ${s.name}`}
                >
                  <Unlink className="size-3.5 text-red-600" aria-hidden />
                </Button>
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (s) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setStateTarget(s)}
            data-testid={`station-state-btn-${s.id}`}
            aria-label={`Ver estado de ${s.name}`}
          >
            <Eye className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditTarget(s)}
            data-testid={`station-edit-btn-${s.id}`}
            aria-label={`Editar ${s.name}`}
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteTarget(s)}
            data-testid={`station-delete-btn-${s.id}`}
            aria-label={`Borrar ${s.name}`}
          >
            <Trash2 className="size-3.5 text-red-600" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  async function handleCreate(values: CreateStationInput, deviceId: string | null) {
    const station = await createMutation.mutateAsync(values);
    setCreateOpen(false);
    if (!deviceId) return;
    try {
      await createDeviceMutation.mutateAsync({ station_id: station.id, device_id: deviceId });
    } catch {
      // Station was created fine — only the binding failed (e.g. device_id
      // taken). Reopen as edit so the admin can retry just the device_id
      // without recreating the station.
      setEditTarget(station);
    }
  }

  async function handleUpdate(values: CreateStationInput, deviceId: string | null) {
    if (!editTarget) return;
    await updateMutation.mutateAsync({ id: editTarget.id, input: values });

    const currentDevice = deviceByStation.get(editTarget.id) ?? null;

    if (!currentDevice && deviceId) {
      try {
        await createDeviceMutation.mutateAsync({ station_id: editTarget.id, device_id: deviceId });
      } catch {
        return; // station saved; keep the edit modal open with the device error visible
      }
    } else if (currentDevice && deviceId === null) {
      setDeviceChangeConfirm({ kind: "clear", station: editTarget, currentDevice });
      return;
    } else if (currentDevice && deviceId && deviceId !== currentDevice.device_id) {
      setDeviceChangeConfirm({
        kind: "replace",
        station: editTarget,
        currentDevice,
        newDeviceId: deviceId,
      });
      return;
    }

    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  async function handleRelease() {
    if (!releaseTarget) return;
    await releaseDeviceMutation.mutateAsync(releaseTarget.id);
    setReleaseTarget(null);
  }

  async function handleUnbind() {
    if (!unbindTarget) return;
    await deleteDeviceMutation.mutateAsync(unbindTarget.id);
    setUnbindTarget(null);
  }

  async function handleConfirmDeviceChange() {
    if (!deviceChangeConfirm) return;
    await deleteDeviceMutation.mutateAsync(deviceChangeConfirm.currentDevice.id);
    if (deviceChangeConfirm.kind === "replace" && deviceChangeConfirm.newDeviceId) {
      try {
        await createDeviceMutation.mutateAsync({
          station_id: deviceChangeConfirm.station.id,
          device_id: deviceChangeConfirm.newDeviceId,
        });
      } catch {
        setDeviceChangeConfirm(null);
        return; // old binding already gone; keep the edit modal open with the new error
      }
    }
    setDeviceChangeConfirm(null);
    setEditTarget(null);
  }

  return (
    <>
      <PageHeader
        title="Stations"
        description="Gestión de gabinetes. Crear, editar, borrar y ver el estado operacional con las baterías dentro."
        actions={
          <Button
            variant="primary"
            onClick={() => setCreateOpen(true)}
            data-testid="station-create-btn"
          >
            <Plus className="size-4" aria-hidden />
            Crear gabinete
          </Button>
        }
      />

      <ErrorBanner error={error} testId="stations-list-error" />

      <DataTable
        rows={data?.stations ?? []}
        columns={columns}
        rowKey={(s) => s.id}
        loading={isPending}
        empty="No hay gabinetes registrados todavía. Creá el primero."
        testId="stations-table"
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear gabinete"
        width="lg"
      >
        <StationForm
          submitLabel="Crear"
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          pending={createMutation.isPending || createDeviceMutation.isPending}
          error={createMutation.error}
        />
      </Modal>

      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title={`Editar ${editTarget?.name ?? ""}`}
        width="lg"
      >
        {editTarget ? (
          <StationForm
            submitLabel="Guardar"
            defaultValues={{
              name: editTarget.name,
              city: editTarget.city,
              address: editTarget.address,
              latitude: Number(editTarget.latitude),
              longitude: Number(editTarget.longitude),
              hourly_rate: Number(editTarget.hourly_rate),
              currency: editTarget.currency,
              total_capacity: editTarget.total_capacity,
              status: editTarget.status,
            }}
            defaultDeviceId={
              deviceByStation.get(editTarget.id)?.device_id ??
              createDeviceMutation.variables?.device_id ??
              ""
            }
            onSubmit={handleUpdate}
            onCancel={() => setEditTarget(null)}
            pending={
              updateMutation.isPending ||
              createDeviceMutation.isPending ||
              deleteDeviceMutation.isPending
            }
            error={updateMutation.error}
            deviceError={createDeviceMutation.error}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Borrar gabinete "${deleteTarget?.name ?? ""}"`}
        description="Esta acción es irreversible. Si el gabinete tiene baterías asignadas, el back rechazará la operación y deberás moverlas o retirarlas primero."
        confirmLabel="Borrar"
        confirmVariant="danger"
        pending={deleteMutation.isPending}
        error={describeError(deleteMutation.error)}
        onCancel={() => {
          deleteMutation.reset();
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={releaseTarget !== null}
        title={`Re-enrolar device_id "${releaseTarget?.device_id ?? ""}"`}
        description="El gabinete pierde su clave API actual y vuelve a quedar pendiente. Usalo cuando resetees o reemplaces el hardware físico — deberá auto-enrolarse de nuevo."
        confirmLabel="Re-enrolar"
        confirmVariant="danger"
        pending={releaseDeviceMutation.isPending}
        error={describeError(releaseDeviceMutation.error)}
        onCancel={() => {
          releaseDeviceMutation.reset();
          setReleaseTarget(null);
        }}
        onConfirm={handleRelease}
      />

      <ConfirmDialog
        open={unbindTarget !== null}
        title={`Quitar device_id "${unbindTarget?.device_id ?? ""}"`}
        description="Esto borra por completo la asignación del gabinete a esta estación (no solo la clave). Si querés volver a usarlo, vas a tener que crear la asignación de nuevo."
        confirmLabel="Quitar"
        confirmVariant="danger"
        pending={deleteDeviceMutation.isPending}
        error={describeError(deleteDeviceMutation.error)}
        onCancel={() => {
          deleteDeviceMutation.reset();
          setUnbindTarget(null);
        }}
        onConfirm={handleUnbind}
      />

      <ConfirmDialog
        open={deviceChangeConfirm !== null}
        title={
          deviceChangeConfirm
            ? deviceChangeConfirm.kind === "clear"
              ? `Liberar device_id "${deviceChangeConfirm.currentDevice.device_id}"`
              : `Reemplazar device_id "${deviceChangeConfirm.currentDevice.device_id}"`
            : ""
        }
        description={
          deviceChangeConfirm
            ? deviceChangeConfirm.kind === "clear"
              ? "Vaciaste el campo device_id. Esto borra la asignación actual del gabinete a esta estación. El gabinete físico deberá volver a enrolarse si se reutiliza en otra estación."
              : `Vas a reemplazar el device_id actual ("${deviceChangeConfirm.currentDevice.device_id}") por "${deviceChangeConfirm.newDeviceId ?? ""}". El gabinete anterior deberá volver a enrolarse si se reutiliza.`
            : ""
        }
        confirmLabel={deviceChangeConfirm?.kind === "clear" ? "Liberar" : "Reemplazar"}
        confirmVariant="danger"
        pending={deleteDeviceMutation.isPending || createDeviceMutation.isPending}
        error={describeError(deleteDeviceMutation.error ?? createDeviceMutation.error)}
        onCancel={() => {
          deleteDeviceMutation.reset();
          createDeviceMutation.reset();
          setDeviceChangeConfirm(null);
        }}
        onConfirm={handleConfirmDeviceChange}
      />

      <StationStateModal
        stationId={stateTarget?.id ?? null}
        open={stateTarget !== null}
        cabinetDevice={stateTarget ? (deviceByStation.get(stateTarget.id) ?? null) : null}
        onClose={() => setStateTarget(null)}
      />

      <EjectBatteryModal
        device={ejectTarget}
        stationName={
          (data?.stations ?? []).find((s) => s.id === ejectTarget?.station_id)?.name ?? ""
        }
        open={ejectTarget !== null}
        onClose={() => setEjectTarget(null)}
      />
    </>
  );
}
