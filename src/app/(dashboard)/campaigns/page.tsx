"use client";

import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { ListVideo, MapPin, Pencil, Plus, Power, PowerOff, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { CampaignAdsModal } from "@/components/campaigns/campaign-ads-modal";
import { CampaignStationsModal } from "@/components/campaigns/campaign-stations-modal";
import { RotationPreviewPanel } from "@/components/campaigns/rotation-preview";
import {
  campaignAdsQueryOptions,
  useCampaigns,
  useCreateCampaign,
  useDeleteCampaign,
  useUpdateCampaign,
} from "@/queries/admin-campaigns.queries";
import { useAdvertisers } from "@/queries/admin-advertisers.queries";
import { paginate, usePagination } from "@/lib/pagination";
import type { Campaign, CreateCampaignInput } from "@/validators/campaign.schema";
import type { Ad } from "@/validators/ad.schema";

export default function CampaignsPage() {
  const campaignsQuery = useCampaigns();
  const advertisersQuery = useAdvertisers();
  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();
  const deleteMutation = useDeleteCampaign();

  const { page, pageSize, setPage, setPageSize } = usePagination();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Campaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [adsTarget, setAdsTarget] = useState<Campaign | null>(null);
  const [stationsTarget, setStationsTarget] = useState<Campaign | null>(null);

  const campaigns = campaignsQuery.data?.campaigns ?? [];
  const advertisers = advertisersQuery.data?.advertisers ?? [];
  const advertiserNameById = new Map(advertisers.map((a) => [a.id, a.name]));

  // One ads query per campaign, shared with `useCampaignAds` via the same
  // query key/cache — used for the "ad count" column and to feed the
  // rotation preview without a dedicated backend endpoint for "all ads".
  const adsResults = useQueries({
    queries: campaigns.map((c) => campaignAdsQueryOptions(c.id)),
  });

  const adsByCampaignId = new Map<string, Ad[]>();
  campaigns.forEach((c, index) => {
    adsByCampaignId.set(c.id, adsResults[index]?.data?.ads ?? []);
  });

  async function handleCreate(values: CreateCampaignInput) {
    await createMutation.mutateAsync(values);
    setCreateOpen(false);
  }

  async function handleUpdate(values: CreateCampaignInput) {
    if (!editTarget) return;
    await updateMutation.mutateAsync({
      id: editTarget.id,
      input: { name: values.name, weight: values.weight, is_active: values.is_active },
    });
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  async function handleToggleActive(campaign: Campaign) {
    await updateMutation.mutateAsync({
      id: campaign.id,
      input: { is_active: !campaign.is_active },
    });
  }

  const columns: Column<Campaign>[] = [
    {
      key: "name",
      header: "Campaña",
      render: (c) => <span className="font-medium">{c.name}</span>,
    },
    {
      key: "advertiser",
      header: "Empresa",
      render: (c) => (
        <span className="text-xs text-zinc-500">
          {advertiserNameById.get(c.advertiser_id) ?? "—"}
        </span>
      ),
    },
    {
      key: "weight",
      header: "Peso",
      render: (c) => <span className="font-mono text-xs">{c.weight}</span>,
    },
    {
      key: "ads",
      header: "Anuncios",
      render: (c) => {
        const result = adsResults[campaigns.findIndex((x) => x.id === c.id)];
        if (result?.isPending) return <span className="text-xs text-zinc-400">…</span>;
        if (result?.isError) return <span className="text-xs text-zinc-400">—</span>;
        const count = result?.data?.ads.length ?? 0;
        return (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAdsTarget(c)}
            data-testid={`campaign-ads-count-${c.id}`}
            title="Gestionar anuncios de esta campaña"
          >
            {count === 0 ? (
              <>
                <Plus className="size-3.5" aria-hidden />
                Agregar
              </>
            ) : (
              `${count} ${count === 1 ? "anuncio" : "anuncios"}`
            )}
          </Button>
        );
      },
    },
    {
      key: "status",
      header: "Estado",
      render: (c) => (
        <button
          type="button"
          onClick={() => handleToggleActive(c)}
          data-testid={`campaign-toggle-btn-${c.id}`}
          aria-label={c.is_active ? `Desactivar ${c.name}` : `Activar ${c.name}`}
          title={c.is_active ? "Desactivar" : "Activar"}
          className="inline-flex items-center gap-1.5 rounded-full transition-opacity hover:opacity-75 disabled:opacity-50"
          disabled={updateMutation.isPending}
        >
          <StatusBadge variant={c.is_active ? "success" : "neutral"}>
            {c.is_active ? (
              <Power className="size-3" aria-hidden />
            ) : (
              <PowerOff className="size-3" aria-hidden />
            )}
            {c.is_active ? "Activa" : "Inactiva"}
          </StatusBadge>
        </button>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAdsTarget(c)}
            data-testid={`campaign-ads-btn-${c.id}`}
            aria-label={`Gestionar anuncios de ${c.name}`}
            title="Gestionar anuncios"
          >
            <ListVideo className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setStationsTarget(c)}
            data-testid={`campaign-stations-btn-${c.id}`}
            aria-label={`Asignar gabinetes a ${c.name}`}
            title="Asignar gabinetes"
          >
            <MapPin className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditTarget(c)}
            data-testid={`campaign-edit-btn-${c.id}`}
            aria-label={`Editar ${c.name}`}
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteTarget(c)}
            data-testid={`campaign-delete-btn-${c.id}`}
            aria-label={`Borrar ${c.name}`}
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
        title="Campañas"
        description="Campañas publicitarias por empresa anunciante y su asignación a gabinetes. Cada gabinete solo reproduce las campañas activas asignadas a él."
        actions={
          <Button
            variant="primary"
            onClick={() => setCreateOpen(true)}
            data-testid="campaign-create-btn"
          >
            <Plus className="size-4" aria-hidden />
            Crear campaña
          </Button>
        }
      />

      <ErrorBanner error={campaignsQuery.error} testId="campaigns-list-error" />

      <DataTable
        rows={paginate(campaigns, page, pageSize)}
        columns={columns}
        rowKey={(c) => c.id}
        loading={campaignsQuery.isPending}
        empty="No hay campañas todavía. Creá la primera."
        testId="campaigns-table"
        pagination={{
          page,
          pageSize,
          total: campaigns.length,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />

      <RotationPreviewPanel campaigns={campaigns} adsByCampaignId={adsByCampaignId} />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear campaña"
        width="md"
      >
        <CampaignForm
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
          <CampaignForm
            editing
            submitLabel="Guardar"
            defaultValues={{
              advertiser_id: editTarget.advertiser_id,
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
        title={`Borrar campaña "${deleteTarget?.name ?? ""}"`}
        description="Esta acción es irreversible. Si el back la rechaza por tener anuncios asociados, borralos primero desde 'Gestionar anuncios'."
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

      <CampaignAdsModal
        campaign={adsTarget}
        open={adsTarget !== null}
        onClose={() => setAdsTarget(null)}
      />

      <CampaignStationsModal
        campaign={stationsTarget}
        open={stationsTarget !== null}
        onClose={() => setStationsTarget(null)}
      />
    </>
  );
}
