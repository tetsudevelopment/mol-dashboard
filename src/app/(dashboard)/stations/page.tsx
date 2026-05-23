"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StationForm } from "@/components/stations/station-form";
import { StationStateModal } from "@/components/stations/station-state-modal";
import {
  useStations,
  useCreateStation,
  useUpdateStation,
  useDeleteStation,
} from "@/queries/admin-stations.queries";
import {
  MAX_POWER_BANKS_PER_STATION,
  isStationFull,
  type CreateStationInput,
  type Station,
} from "@/validators/station.schema";

export default function StationsPage() {
  const { data, error, isPending } = useStations();
  const createMutation = useCreateStation();
  const updateMutation = useUpdateStation();
  const deleteMutation = useDeleteStation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Station | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Station | null>(null);
  const [stateTarget, setStateTarget] = useState<Station | null>(null);

  const columns: Column<Station>[] = [
    {
      key: "name",
      header: "Nombre",
      render: (s) => (
        <div>
          <div className="font-medium">{s.name}</div>
          <div className="text-xs text-zinc-500">{s.city}{s.zone ? ` · ${s.zone}` : ""}</div>
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

  async function handleCreate(values: CreateStationInput) {
    await createMutation.mutateAsync(values);
    setCreateOpen(false);
  }

  async function handleUpdate(values: CreateStationInput) {
    if (!editTarget) return;
    await updateMutation.mutateAsync({ id: editTarget.id, input: values });
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
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
          pending={createMutation.isPending}
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
              zone: editTarget.zone ?? "",
              address: editTarget.address,
              latitude: Number(editTarget.latitude),
              longitude: Number(editTarget.longitude),
              hourly_rate: Number(editTarget.hourly_rate),
              currency: editTarget.currency,
              total_capacity: editTarget.total_capacity,
              status: editTarget.status,
              description: editTarget.description ?? "",
              opening_time: editTarget.opening_time?.slice(11, 16) ?? "",
              closing_time: editTarget.closing_time?.slice(11, 16) ?? "",
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditTarget(null)}
            pending={updateMutation.isPending}
            error={updateMutation.error}
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
        error={
          deleteMutation.error instanceof Error ? deleteMutation.error.message : null
        }
        onCancel={() => {
          deleteMutation.reset();
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />

      <StationStateModal
        stationId={stateTarget?.id ?? null}
        open={stateTarget !== null}
        onClose={() => setStateTarget(null)}
      />
    </>
  );
}
