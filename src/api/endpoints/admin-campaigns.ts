import { z } from "zod";
import { apiClient, unwrap } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import {
  CampaignSchema,
  CampaignStationsSchema,
  type Campaign,
  type CampaignStations,
  type CreateCampaignInput,
  type UpdateCampaignInput,
} from "@/validators/campaign.schema";
import { AdSchema, toAdRequestBody, type Ad, type CreateAdInput } from "@/validators/ad.schema";
import { updateAd, deleteAd } from "./admin-ads";

const ListResponseSchema = z.object({
  campaigns: z.array(CampaignSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

const SingleResponseSchema = z.object({ campaign: CampaignSchema });

export interface ListCampaignsFilters {
  advertiser_id?: string;
  is_active?: boolean;
}

/**
 * `GET /admin/campaigns` default-paginates. Request the max page size and,
 * if `total` exceeds what a single page returns, fetch the remaining pages —
 * same fetch-all-pages trick as admin-ads.ts's `listAds`, so the campaigns
 * page never silently shows a truncated list.
 */
const CAMPAIGNS_PAGE_SIZE = 100;

async function fetchCampaignsPage(filters: ListCampaignsFilters, page: number) {
  const raw = await unwrap(
    apiClient.get<ApiEnvelope<unknown>>("/admin/campaigns", {
      params: { ...filters, page, page_size: CAMPAIGNS_PAGE_SIZE },
    }),
  );
  return ListResponseSchema.parse(raw);
}

export async function listCampaigns(
  filters: ListCampaignsFilters = {},
): Promise<{ campaigns: Campaign[] }> {
  const first = await fetchCampaignsPage(filters, 1);
  const campaigns = [...first.campaigns];

  const totalPages = Math.ceil(first.total / first.pageSize);
  for (let page = 2; page <= totalPages; page++) {
    const next = await fetchCampaignsPage(filters, page);
    campaigns.push(...next.campaigns);
  }

  return { campaigns };
}

export async function getCampaign(id: string): Promise<Campaign> {
  const raw = await unwrap(apiClient.get<ApiEnvelope<unknown>>(`/admin/campaigns/${id}`));
  return SingleResponseSchema.parse(raw).campaign;
}

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const raw = await unwrap(
    apiClient.post<ApiEnvelope<unknown>>("/admin/campaigns", input),
  );
  return SingleResponseSchema.parse(raw).campaign;
}

export async function updateCampaign(
  id: string,
  input: UpdateCampaignInput,
): Promise<Campaign> {
  const raw = await unwrap(
    apiClient.patch<ApiEnvelope<unknown>>(`/admin/campaigns/${id}`, input),
  );
  return SingleResponseSchema.parse(raw).campaign;
}

export async function deleteCampaign(id: string): Promise<void> {
  await apiClient.delete(`/admin/campaigns/${id}`);
}

// -- Ad membership (nested convenience alongside GET/POST /admin/ads?campaign_id=) --

const AdsListResponseSchema = z.object({
  ads: z.array(AdSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

const AdSingleResponseSchema = z.object({ ad: AdSchema });

const CAMPAIGN_ADS_PAGE_SIZE = 100;

async function fetchCampaignAdsPage(campaignId: string, page: number) {
  const raw = await unwrap(
    apiClient.get<ApiEnvelope<unknown>>(`/admin/campaigns/${campaignId}/ads`, {
      params: { page, page_size: CAMPAIGN_ADS_PAGE_SIZE },
    }),
  );
  return AdsListResponseSchema.parse(raw);
}

export async function listCampaignAds(campaignId: string): Promise<{ ads: Ad[] }> {
  const first = await fetchCampaignAdsPage(campaignId, 1);
  const ads = [...first.ads];

  const totalPages = Math.ceil(first.total / first.pageSize);
  for (let page = 2; page <= totalPages; page++) {
    const next = await fetchCampaignAdsPage(campaignId, page);
    ads.push(...next.ads);
  }

  return { ads };
}

/**
 * POST /admin/campaigns/:id/ads — the backend's CreateCampaignAdSchema is
 * CreateAdSchema.omit({ campaign_id: true }) (injected from the path
 * instead), so `campaign_id` is left out of the body here even though the
 * caller passes a full `CreateAdInput` (e.g. straight from a form that also
 * carries `campaign_id` for the flat /admin/ads endpoint).
 */
export async function createCampaignAd(campaignId: string, input: CreateAdInput): Promise<Ad> {
  const { media_url, media_type, duration_seconds, is_active, sort_order } =
    toAdRequestBody(input);
  const body = { media_url, media_type, duration_seconds, is_active, sort_order };
  const raw = await unwrap(
    apiClient.post<ApiEnvelope<unknown>>(`/admin/campaigns/${campaignId}/ads`, body),
  );
  return AdSingleResponseSchema.parse(raw).ad;
}

// No nested PATCH/DELETE for ads exists on the backend — both go through the
// flat /admin/ads/:id endpoint regardless of which campaign the ad belongs
// to, so these are the exact same calls as admin-ads.ts's updateAd/deleteAd.
// Re-exported under the campaign-scoped name instead of reimplemented, so
// there is exactly one place that builds a PATCH/DELETE /admin/ads/:id call.
export const updateCampaignAd = updateAd;
export const deleteCampaignAd = deleteAd;

// -- Station assignment --

export async function listCampaignStations(campaignId: string): Promise<CampaignStations> {
  const raw = await unwrap(
    apiClient.get<ApiEnvelope<unknown>>(`/admin/campaigns/${campaignId}/stations`),
  );
  return CampaignStationsSchema.parse(raw);
}

/** Replaces the FULL station assignment set for a campaign — empty array is valid. */
export async function replaceCampaignStations(
  campaignId: string,
  stationIds: string[],
): Promise<CampaignStations> {
  const raw = await unwrap(
    apiClient.put<ApiEnvelope<unknown>>(`/admin/campaigns/${campaignId}/stations`, {
      station_ids: stationIds,
    }),
  );
  return CampaignStationsSchema.parse(raw);
}

/** Idempotent unassign — succeeds even if the station wasn't assigned. */
export async function unassignCampaignStation(
  campaignId: string,
  stationId: string,
): Promise<void> {
  await apiClient.delete(`/admin/campaigns/${campaignId}/stations/${stationId}`);
}
