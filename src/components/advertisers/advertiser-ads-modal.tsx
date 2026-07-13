"use client";

import { useState } from "react";
import { Film, Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/status-badge";
import { AdForm } from "@/components/advertisers/ad-form";
import { useAds, useCreateAd, useDeleteAd, useUpdateAd } from "@/queries/admin-ads.queries";
import type { Advertiser } from "@/validators/advertiser.schema";
import type { Ad, CreateAdInput, UpdateAdInput } from "@/validators/ad.schema";

export function AdvertiserAdsModal({
  advertiser,
  open,
  onClose,
}: {
  advertiser: Advertiser | null;
  open: boolean;
  onClose: () => void;
}) {
  const advertiserId = advertiser?.id;
  const adsQuery = useAds(open ? advertiserId : undefined);
  const createMutation = useCreateAd();
  const updateMutation = useUpdateAd();
  const deleteMutation = useDeleteAd();

  const [view, setView] = useState<"list" | "form">("list");
  const [editTarget, setEditTarget] = useState<Ad | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);

  const ads = adsQuery.data?.ads ?? [];

  function handleClose() {
    setView("list");
    setEditTarget(null);
    createMutation.reset();
    updateMutation.reset();
    onClose();
  }

  function openCreate() {
    createMutation.reset();
    setEditTarget(null);
    setView("form");
  }

  function openEdit(ad: Ad) {
    updateMutation.reset();
    setEditTarget(ad);
    setView("form");
  }

  function backToList() {
    setView("list");
    setEditTarget(null);
  }

  async function handleSubmit(values: CreateAdInput) {
    if (editTarget) {
      const updateInput: UpdateAdInput = {
        media_url: values.media_url,
        media_type: values.media_type,
        duration_seconds: values.duration_seconds,
        is_active: values.is_active,
        sort_order: values.sort_order,
      };
      await updateMutation.mutateAsync({
        id: editTarget.id,
        advertiserId: values.advertiser_id,
        input: updateInput,
      });
    } else {
      await createMutation.mutateAsync(values);
    }
    backToList();
  }

  async function handleDelete() {
    if (!deleteTarget || !advertiserId) return;
    await deleteMutation.mutateAsync({ id: deleteTarget.id, advertiserId });
    setDeleteTarget(null);
  }

  const columns: Column<Ad>[] = [
    {
      key: "media",
      header: "Medio",
      render: (ad) => (
        <div className="flex items-center gap-2">
          {ad.media_type === "video" ? (
            <Film className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
          ) : (
            <ImageIcon className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
          )}
          <span className="max-w-56 truncate font-mono text-xs" title={ad.media_url}>
            {ad.media_url}
          </span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      render: (ad) => <span className="text-xs">{ad.media_type}</span>,
    },
    {
      key: "duration",
      header: "Duración",
      render: (ad) => (
        <span className="text-xs">
          {ad.media_type === "image" ? `${String(ad.duration_seconds ?? "—")}s` : "Duración del archivo"}
        </span>
      ),
    },
    {
      key: "sort_order",
      header: "Orden",
      render: (ad) => <span className="text-xs">{ad.sort_order}</span>,
    },
    {
      key: "status",
      header: "Estado",
      render: (ad) => (
        <StatusBadge variant={ad.is_active ? "success" : "neutral"}>
          {ad.is_active ? "Activo" : "Inactivo"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (ad) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEdit(ad)}
            data-testid={`ad-edit-btn-${ad.id}`}
            aria-label="Editar anuncio"
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteTarget(ad)}
            data-testid={`ad-delete-btn-${ad.id}`}
            aria-label="Borrar anuncio"
          >
            <Trash2 className="size-3.5 text-red-600" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        view === "form"
          ? editTarget
            ? `Editar anuncio de ${advertiser?.name ?? ""}`
            : `Nuevo anuncio para ${advertiser?.name ?? ""}`
          : `Anuncios de ${advertiser?.name ?? ""}`
      }
      width="xl"
    >
      {!advertiser ? null : view === "form" ? (
        <AdForm
          advertiserId={advertiser.id}
          submitLabel={editTarget ? "Guardar" : "Crear"}
          defaultValues={
            editTarget
              ? {
                  advertiser_id: editTarget.advertiser_id,
                  media_url: editTarget.media_url,
                  media_type: editTarget.media_type,
                  duration_seconds: editTarget.duration_seconds,
                  is_active: editTarget.is_active,
                  sort_order: editTarget.sort_order,
                }
              : { sort_order: ads.length }
          }
          onSubmit={handleSubmit}
          onCancel={backToList}
          pending={createMutation.isPending || updateMutation.isPending}
          error={createMutation.error ?? updateMutation.error}
        />
      ) : (
        <div data-testid="advertiser-ads-content" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Peso de la empresa: <span className="font-medium">{advertiser.weight}</span>
              {" · "}
              {ads.length} {ads.length === 1 ? "anuncio" : "anuncios"}
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={openCreate}
              data-testid="ad-create-btn"
            >
              <Plus className="size-3.5" aria-hidden />
              Nuevo anuncio
            </Button>
          </div>

          <ErrorBanner error={adsQuery.error} testId="ads-list-error" />

          <DataTable
            rows={ads}
            columns={columns}
            rowKey={(ad) => ad.id}
            loading={adsQuery.isPending}
            empty="Esta empresa todavía no tiene anuncios cargados."
            testId="ads-table"
          />
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Borrar anuncio"
        description="Esta acción es irreversible. El anuncio deja de aparecer en la rotación del gabinete de inmediato."
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
    </Modal>
  );
}
