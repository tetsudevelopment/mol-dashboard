"use client";

import { useState } from "react";
import { ArrowRightLeft, Pencil, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Select } from "@/components/ui/input";
import { PowerBankForm } from "@/components/power-banks/power-bank-form";
import { MovePowerBankModal } from "@/components/power-banks/move-modal";
import {
  useCreatePowerBank,
  useDeletePowerBank,
  usePowerBanks,
  useUpdatePowerBank,
} from "@/queries/admin-power-banks.queries";
import { useStations } from "@/queries/admin-stations.queries";
import type {
  CreatePowerBankInput,
  PowerBank,
  PowerBankStatus,
} from "@/validators/power-bank.schema";
import { MAX_POWER_BANKS_PER_STATION, isStationFull } from "@/validators/station.schema";

const STATUS_VARIANT = {
  available: "success",
  rented: "info",
  charging: "warning",
  damaged: "error",
  retired: "neutral",
} as const;

export default function PowerBanksPage() {
  const [stationFilter, setStationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<PowerBankStatus | "">("");

  const stationsQuery = useStations();
  const powerBanksQuery = usePowerBanks({
    ...(stationFilter !== "" ? { stationId: stationFilter } : {}),
    ...(statusFilter !== "" ? { status: statusFilter } : {}),
  });

  const createMutation = useCreatePowerBank();
  const updateMutation = useUpdatePowerBank();
  const deleteMutation = useDeletePowerBank();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PowerBank | null>(null);
  const [moveTarget, setMoveTarget] = useState<PowerBank | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PowerBank | null>(null);

  const stations = stationsQuery.data?.stations ?? [];
  const stationName = (id: string) =>
    stations.find((s) => s.id === id)?.name ?? id.slice(0, 8);

  const columns: Column<PowerBank>[] = [
    {
      key: "code",
      header: "Código",
      render: (pb) => (
        <div>
          <div className="font-mono text-xs font-medium">{pb.code}</div>
          {pb.model ? <div className="text-xs text-zinc-500">{pb.model}</div> : null}
        </div>
      ),
    },
    {
      key: "station",
      header: "Gabinete",
      render: (pb) => <span className="text-xs">{stationName(pb.station_id)}</span>,
    },
    {
      key: "battery",
      header: "Batería",
      render: (pb) => <span className="text-xs">{pb.battery_level}%</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (pb) => (
        <StatusBadge variant={STATUS_VARIANT[pb.status]}>{pb.status}</StatusBadge>
      ),
    },
    {
      key: "qr",
      header: "QR",
      render: (pb) => (
        <span className="font-mono text-[10px] text-zinc-500" title={pb.qr_code}>
          {pb.qr_code.slice(0, 12)}…
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (pb) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMoveTarget(pb)}
            data-testid={`pb-move-btn-${pb.id}`}
            aria-label={`Mover ${pb.code}`}
            title="Mover de gabinete"
          >
            <ArrowRightLeft className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditTarget(pb)}
            data-testid={`pb-edit-btn-${pb.id}`}
            aria-label={`Editar ${pb.code}`}
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteTarget(pb)}
            data-testid={`pb-delete-btn-${pb.id}`}
            aria-label={`Borrar ${pb.code}`}
          >
            <Trash2 className="size-3.5 text-red-600" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  async function handleCreate(values: CreatePowerBankInput) {
    await createMutation.mutateAsync(values);
    setCreateOpen(false);
  }

  async function handleUpdate(values: CreatePowerBankInput) {
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
        title="Power Banks"
        description="Gestión de baterías. Crear, editar, mover entre gabinetes y retirar."
        actions={
          <Button
            variant="primary"
            onClick={() => setCreateOpen(true)}
            disabled={stations.length === 0 || stations.every(isStationFull)}
            title={
              stations.every(isStationFull)
                ? "Todos los gabinetes están llenos"
                : undefined
            }
            data-testid="pb-create-btn"
          >
            <Plus className="size-4" aria-hidden />
            Crear batería
          </Button>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="Gabinete" htmlFor="filter-station">
          <Select
            id="filter-station"
            data-testid="filter-station"
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
          >
            <option value="">Todos</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" htmlFor="filter-status">
          <Select
            id="filter-status"
            data-testid="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PowerBankStatus | "")}
          >
            <option value="">Todos</option>
            <option value="available">available</option>
            <option value="rented">rented</option>
            <option value="charging">charging</option>
            <option value="damaged">damaged</option>
            <option value="retired">retired</option>
          </Select>
        </Field>
      </section>

      {stations.length > 0 && stations.every(isStationFull) ? (
        <p
          data-testid="pb-all-stations-full"
          className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          Todos los gabinetes están al máximo de {MAX_POWER_BANKS_PER_STATION} baterías. Para
          crear una batería nueva, primero retirá una existente o esperá a que se libere un slot.
        </p>
      ) : null}

      {stations.length === 0 ? (
        <p
          data-testid="pb-no-stations-hint"
          className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        >
          Todavía no hay gabinetes. Creá uno antes de poder registrar baterías.
        </p>
      ) : null}

      <ErrorBanner error={powerBanksQuery.error} testId="pb-list-error" />

      <DataTable
        rows={powerBanksQuery.data?.powerBanks ?? []}
        columns={columns}
        rowKey={(pb) => pb.id}
        loading={powerBanksQuery.isPending}
        empty="Sin baterías que coincidan con los filtros."
        testId="pb-table"
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear batería"
        width="md"
      >
        <PowerBankForm
          stations={stations}
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
        title={`Editar ${editTarget?.code ?? ""}`}
        width="md"
      >
        {editTarget ? (
          <PowerBankForm
            stations={stations}
            submitLabel="Guardar"
            defaultValues={{
              code: editTarget.code,
              station_id: editTarget.station_id,
              model: editTarget.model ?? "",
              qr_code: editTarget.qr_code,
              status: editTarget.status,
              battery_level: editTarget.battery_level,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditTarget(null)}
            pending={updateMutation.isPending}
            error={updateMutation.error}
            lockStation
          />
        ) : null}
      </Modal>

      <MovePowerBankModal
        powerBank={moveTarget}
        stations={stations}
        open={moveTarget !== null}
        onClose={() => setMoveTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Borrar batería "${deleteTarget?.code ?? ""}"`}
        description="Esta acción es irreversible. Si la batería tiene rentals históricos, el back rechazará el borrado — marcala como 'retired' en su lugar."
        confirmLabel="Borrar"
        confirmVariant="danger"
        pending={deleteMutation.isPending}
        error={deleteMutation.error instanceof Error ? deleteMutation.error.message : null}
        onCancel={() => {
          deleteMutation.reset();
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}
