"use client";

import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { ListVideo, Pencil, Plus, Power, PowerOff, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AdvertiserForm } from "@/components/advertisers/advertiser-form";
import { AdvertiserAdsModal } from "@/components/advertisers/advertiser-ads-modal";
import { RotationPreviewPanel } from "@/components/advertisers/rotation-preview";
import {
  useAdvertisers,
  useCreateAdvertiser,
  useDeleteAdvertiser,
  useUpdateAdvertiser,
} from "@/queries/admin-advertisers.queries";
import { adsQueryOptions } from "@/queries/admin-ads.queries";
import type { Advertiser, CreateAdvertiserInput } from "@/validators/advertiser.schema";
import type { Ad } from "@/validators/ad.schema";

export default function PublicidadPage() {
  const advertisersQuery = useAdvertisers();
  const createMutation = useCreateAdvertiser();
  const updateMutation = useUpdateAdvertiser();
  const deleteMutation = useDeleteAdvertiser();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Advertiser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Advertiser | null>(null);
  const [adsTarget, setAdsTarget] = useState<Advertiser | null>(null);

  const advertisers = advertisersQuery.data?.advertisers ?? [];

  // One ads query per advertiser, shared with `useAds` via the same query
  // key/cache — used for the "ad count" column and to feed the rotation
  // preview without a dedicated backend endpoint for "all ads".
  const adsResults = useQueries({
    queries: advertisers.map((a) => adsQueryOptions(a.id)),
  });

  const adsByAdvertiserId = new Map<string, Ad[]>();
  advertisers.forEach((a, index) => {
    adsByAdvertiserId.set(a.id, adsResults[index]?.data?.ads ?? []);
  });

  async function handleCreate(values: CreateAdvertiserInput) {
    await createMutation.mutateAsync(values);
    setCreateOpen(false);
  }

  async function handleUpdate(values: CreateAdvertiserInput) {
    if (!editTarget) return;
    await updateMutation.mutateAsync({ id: editTarget.id, input: values });
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  async function handleToggleActive(advertiser: Advertiser) {
    await updateMutation.mutateAsync({
      id: advertiser.id,
      input: { is_active: !advertiser.is_active },
    });
  }

  const columns: Column<Advertiser>[] = [
    {
      key: "name",
      header: "Empresa",
      render: (a) => <span className="font-medium">{a.name}</span>,
    },
    {
      key: "weight",
      header: "Peso",
      render: (a) => <span className="font-mono text-xs">{a.weight}</span>,
    },
    {
      key: "ads",
      header: "Anuncios",
      render: (a) => {
        const result = adsResults[advertisers.findIndex((x) => x.id === a.id)];
        if (result?.isPending) return <span className="text-xs text-zinc-400">…</span>;
        if (result?.isError) return <span className="text-xs text-zinc-400">—</span>;
        return <span className="text-xs">{result?.data?.ads.length ?? 0}</span>;
      },
    },
    {
      key: "status",
      header: "Estado",
      render: (a) => (
        <button
          type="button"
          onClick={() => handleToggleActive(a)}
          data-testid={`advertiser-toggle-btn-${a.id}`}
          aria-label={a.is_active ? `Desactivar ${a.name}` : `Activar ${a.name}`}
          title={a.is_active ? "Desactivar" : "Activar"}
          className="inline-flex items-center gap-1.5 rounded-full transition-opacity hover:opacity-75 disabled:opacity-50"
          disabled={updateMutation.isPending}
        >
          <StatusBadge variant={a.is_active ? "success" : "neutral"}>
            {a.is_active ? (
              <Power className="size-3" aria-hidden />
            ) : (
              <PowerOff className="size-3" aria-hidden />
            )}
            {a.is_active ? "Activa" : "Inactiva"}
          </StatusBadge>
        </button>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (a) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAdsTarget(a)}
            data-testid={`advertiser-ads-btn-${a.id}`}
            aria-label={`Ver anuncios de ${a.name}`}
            title="Ver anuncios"
          >
            <ListVideo className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditTarget(a)}
            data-testid={`advertiser-edit-btn-${a.id}`}
            aria-label={`Editar ${a.name}`}
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteTarget(a)}
            data-testid={`advertiser-delete-btn-${a.id}`}
            aria-label={`Borrar ${a.name}`}
          >
            <Trash2 className="size-3.5 text-red-600" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Publicidad"
        description="Empresas anunciantes y sus anuncios. El carrusel del gabinete reproduce esto en vez de la grilla de baterías."
        actions={
          <Button
            variant="primary"
            onClick={() => setCreateOpen(true)}
            data-testid="advertiser-create-btn"
          >
            <Plus className="size-4" aria-hidden />
            Crear empresa
          </Button>
        }
      />

      <ErrorBanner error={advertisersQuery.error} testId="advertisers-list-error" />

      <DataTable
        rows={advertisers}
        columns={columns}
        rowKey={(a) => a.id}
        loading={advertisersQuery.isPending}
        empty="No hay empresas anunciantes todavía. Creá la primera."
        testId="advertisers-table"
      />

      <RotationPreviewPanel advertisers={advertisers} adsByAdvertiserId={adsByAdvertiserId} />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear empresa anunciante"
        width="md"
      >
        <AdvertiserForm
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
        width="md"
      >
        {editTarget ? (
          <AdvertiserForm
            submitLabel="Guardar"
            defaultValues={{
              name: editTarget.name,
              weight: editTarget.weight,
              is_active: editTarget.is_active,
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
        title={`Borrar empresa "${deleteTarget?.name ?? ""}"`}
        description="Esta acción es irreversible y borra también la posibilidad de reproducir sus anuncios. Si el back la rechaza por tener anuncios asociados, borralos primero."
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

      <AdvertiserAdsModal
        advertiser={adsTarget}
        open={adsTarget !== null}
        onClose={() => setAdsTarget(null)}
      />
    </>
  );
}
