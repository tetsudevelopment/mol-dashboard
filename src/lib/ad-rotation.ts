/**
 * Client-side preview of the ad playlist a cabinet would play. Mirrors the
 * smooth weighted round-robin (nginx-style) that the backend runs for real in
 * `GET /devices/me/ad-playlist` (see `buildAdPlaylist` in moltech_api): on
 * every pick, add each active campaign's weight to its running counter, pick
 * the highest counter, then subtract the total weight from the winner.
 * Within a campaign, its own ads rotate in `sort_order` sequence.
 *
 * The run length also mirrors the backend: it always completes whole
 * weight-cycles — never stops mid-cycle — extended across as many full
 * cycles as needed for every participant's ads to get at least one turn,
 * capped at `MAX_ROTATION_PREVIEW_PICKS`. Stopping as soon as every ad has
 * appeared once (mid-cycle) would distort the weight proportions shown to
 * the admin.
 *
 * This is a preview only — it does not call the backend and must stay in
 * sync "by eye" with the real algorithm, not by sharing code with it. It
 * also does not account for per-station campaign assignment — the real
 * per-gabinete playlist only interleaves the campaigns actually assigned to
 * that station.
 */

export interface RotationCampaignInput {
  id: string;
  name: string;
  weight: number;
}

export interface RotationAdInput {
  id: string;
  media_url: string;
  media_type: "image" | "video";
  sort_order: number;
}

export interface RotationPreviewItem {
  position: number;
  campaignId: string;
  campaignName: string;
  ad: RotationAdInput;
}

/** Hard cap so a pathological weight spread can't spin the preview forever. */
export const MAX_ROTATION_PREVIEW_PICKS = 100;

interface Participant {
  id: string;
  name: string;
  weight: number;
  ads: RotationAdInput[];
  current: number;
  cursor: number;
}

export function computeRotationPreview(
  campaigns: RotationCampaignInput[],
  adsByCampaign: Map<string, RotationAdInput[]>,
): RotationPreviewItem[] {
  const participants: Participant[] = campaigns
    .filter((c) => c.weight >= 1)
    .map((c) => ({
      id: c.id,
      name: c.name,
      weight: c.weight,
      ads: [...(adsByCampaign.get(c.id) ?? [])].sort(
        (x, y) => x.sort_order - y.sort_order,
      ),
      current: 0,
      cursor: 0,
    }))
    .filter((p) => p.ads.length > 0);

  if (participants.length === 0) return [];

  const totalWeight = participants.reduce((sum, p) => sum + p.weight, 0);

  // Same formula as buildAdPlaylist: one full weight-cycle per participant,
  // extended (in whole additional cycles) until every participant's ads
  // have each appeared at least once, capped at MAX_ROTATION_PREVIEW_PICKS.
  const cyclesNeeded = Math.max(
    1,
    ...participants.map((p) => Math.ceil(p.ads.length / p.weight)),
  );
  const picks = Math.min(totalWeight * cyclesNeeded, MAX_ROTATION_PREVIEW_PICKS);

  const result: RotationPreviewItem[] = [];

  for (let pick = 0; pick < picks; pick++) {
    for (const p of participants) p.current += p.weight;

    let winner = participants[0];
    for (const p of participants) {
      if (p.current > winner.current) winner = p;
    }
    winner.current -= totalWeight;

    const ad = winner.ads[winner.cursor % winner.ads.length];
    winner.cursor += 1;

    result.push({
      position: result.length + 1,
      campaignId: winner.id,
      campaignName: winner.name,
      ad,
    });
  }

  return result;
}
