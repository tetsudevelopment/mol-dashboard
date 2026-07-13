"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/input";
import { ErrorBanner } from "@/components/ui/error-banner";
import { useStations } from "@/queries/admin-stations.queries";
import {
  useCampaignStations,
  useReplaceCampaignStations,
} from "@/queries/admin-campaigns.queries";
import type { Campaign } from "@/validators/campaign.schema";

export function CampaignStationsModal({
  campaign,
  open,
  onClose,
}: {
  campaign: Campaign | null;
  open: boolean;
  onClose: () => void;
}) {
  const campaignId = campaign?.id;
  const stationsQuery = useStations();
  const campaignStationsQuery = useCampaignStations(open ? campaignId : undefined);
  const replaceMutation = useReplaceCampaignStations();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Seed local selection from the campaign's currently-assigned stations —
  // the checkboxes are locally editable before submit, so this can't be
  // plain derived state. Adjusted during render (React's recommended
  // alternative to a sync useEffect here: https://react.dev/learn/you-might-not-need-an-effect)
  // instead of in an effect, comparing against the last-synced reference so
  // it only resets `selected` when the fetched station_ids actually change
  // (a new campaign opened, or a refetch returns different data).
  const fetchedStationIds = campaignStationsQuery.data?.station_ids;
  const [syncedStationIds, setSyncedStationIds] = useState<string[] | undefined>(undefined);
  if (fetchedStationIds !== syncedStationIds) {
    setSyncedStationIds(fetchedStationIds);
    setSelected(new Set(fetchedStationIds ?? []));
  }

  function handleClose() {
    replaceMutation.reset();
    onClose();
  }

  function toggle(stationId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(stationId)) {
        next.delete(stationId);
      } else {
        next.add(stationId);
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (!campaignId) return;
    await replaceMutation.mutateAsync({ campaignId, stationIds: Array.from(selected) });
    onClose();
  }

  const stations = stationsQuery.data?.stations ?? [];

  return (
    <Modal open={open} onClose={handleClose} title={`Gabinetes de ${campaign?.name ?? ""}`} width="lg">
      {!campaign ? null : (
        <div data-testid="campaign-stations-content" className="space-y-4">
          <p className="text-xs text-zinc-500">
            Marcá los gabinetes donde esta campaña debe reproducirse. Un gabinete sin campañas
            activas asignadas no muestra publicidad.
          </p>

          <ErrorBanner
            error={stationsQuery.error ?? campaignStationsQuery.error}
            testId="campaign-stations-error"
          />

          <ul
            data-testid="campaign-stations-list"
            className="max-h-80 space-y-1 overflow-y-auto rounded-md border border-zinc-200 p-2 dark:border-zinc-800"
          >
            {stationsQuery.isPending || campaignStationsQuery.isPending ? (
              <li className="px-2 py-4 text-center text-xs text-zinc-500">Cargando…</li>
            ) : stations.length === 0 ? (
              <li className="px-2 py-4 text-center text-xs text-zinc-500">
                No hay gabinetes creados todavía.
              </li>
            ) : (
              stations.map((station) => (
                <li key={station.id}>
                  <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <Checkbox
                      checked={selected.has(station.id)}
                      onChange={() => toggle(station.id)}
                      data-testid={`campaign-station-checkbox-${station.id}`}
                    />
                    <span className="flex flex-col">
                      <span className="font-medium leading-tight">{station.name}</span>
                      <span className="text-xs text-zinc-500">{station.city}</span>
                    </span>
                  </label>
                </li>
              ))
            )}
          </ul>

          <ErrorBanner error={replaceMutation.error} testId="campaign-stations-form-error" />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClose} disabled={replaceMutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={replaceMutation.isPending || campaignStationsQuery.isPending}
              data-testid="campaign-stations-submit"
            >
              {replaceMutation.isPending ? "Guardando…" : "Guardar asignación"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
