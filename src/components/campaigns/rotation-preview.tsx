"use client";

import { ChevronRight, Film, Image as ImageIcon, Repeat } from "lucide-react";

import {
  computeRotationPreview,
  type RotationAdInput,
  type RotationCampaignInput,
} from "@/lib/ad-rotation";
import type { Campaign } from "@/validators/campaign.schema";
import type { Ad } from "@/validators/ad.schema";

/**
 * Read-only simulation of the playlist order across every active campaign
 * shown here, computed entirely in the browser from what's already loaded
 * (active campaigns × their active ads). It never calls the backend and does
 * NOT account for per-station campaign assignment — the real playlist for a
 * specific gabinete is decided by `GET /devices/me/ad-playlist`, which only
 * interleaves the campaigns actually assigned to that station. This panel
 * exists purely so an admin can sanity-check campaign weights before saving
 * them.
 */
export function RotationPreviewPanel({
  campaigns,
  adsByCampaignId,
}: {
  campaigns: Campaign[];
  adsByCampaignId: Map<string, Ad[]>;
}) {
  const rotationCampaigns: RotationCampaignInput[] = campaigns
    .filter((c) => c.is_active)
    .map((c) => ({ id: c.id, name: c.name, weight: c.weight }));

  const adsMap = new Map<string, RotationAdInput[]>();
  for (const [campaignId, ads] of adsByCampaignId) {
    adsMap.set(
      campaignId,
      ads
        .filter((ad) => ad.is_active)
        .map((ad) => ({
          id: ad.id,
          media_url: ad.media_url,
          media_type: ad.media_type,
          sort_order: ad.sort_order,
        })),
    );
  }

  const preview = computeRotationPreview(rotationCampaigns, adsMap);

  return (
    <section
      data-testid="rotation-preview"
      className="mt-8 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <header className="mb-3 flex items-start gap-2">
        <Repeat className="mt-0.5 size-4 shrink-0 text-zinc-400" aria-hidden />
        <div>
          <h2 className="text-sm font-semibold">Vista previa de la rotación</h2>
          <p className="text-xs text-zinc-500">
            Simulación local de cómo se intercalarían las campañas activas hoy (weighted
            round-robin suave, igual al backend), sin tener en cuenta a qué gabinetes está
            asignada cada una. No se consulta al backend — es solo para validar los pesos
            antes de guardarlos.
          </p>
        </div>
      </header>

      {preview.length === 0 ? (
        <p
          data-testid="rotation-preview-empty"
          className="rounded-md border border-dashed border-zinc-300 px-3 py-4 text-center text-xs text-zinc-500 dark:border-zinc-700"
        >
          No hay anuncios activos todavía. Marcá una campaña como activa y cargale al menos un
          anuncio activo para ver la rotación acá.
        </p>
      ) : (
        <ol
          data-testid="rotation-preview-list"
          className="flex flex-wrap items-center gap-1.5 text-xs"
        >
          {preview.map((item, index) => (
            <li key={`${item.position}-${item.ad.id}`} className="flex items-center gap-1.5">
              <span
                data-testid="rotation-preview-item"
                className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 dark:border-zinc-800 dark:bg-zinc-950"
                title={item.ad.media_url}
              >
                <span className="font-mono text-[10px] text-zinc-400">{item.position}</span>
                {item.ad.media_type === "video" ? (
                  <Film className="size-3 text-zinc-400" aria-hidden />
                ) : (
                  <ImageIcon className="size-3 text-zinc-400" aria-hidden />
                )}
                <span className="font-medium">{item.campaignName}</span>
              </span>
              {index < preview.length - 1 ? (
                <ChevronRight className="size-3 text-zinc-300 dark:text-zinc-700" aria-hidden />
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
