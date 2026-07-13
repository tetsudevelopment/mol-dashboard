import { z } from "zod";
import { apiClient, unwrap } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import {
  AdSchema,
  type Ad,
  type CreateAdInput,
  type UpdateAdInput,
} from "@/validators/ad.schema";

const ListResponseSchema = z.object({
  ads: z.array(AdSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

const SingleResponseSchema = z.object({ ad: AdSchema });

/**
 * `GET /admin/ads` default-paginates at page_size 20 (max 100). Request the
 * max page size and, if `total` exceeds what a single page returns, fetch
 * the remaining pages so callers (ads modal, ad counts, rotation preview)
 * always see the full set — an advertiser with more than one page of ads
 * must not silently show a truncated list.
 */
const ADS_PAGE_SIZE = 100;

async function fetchAdsPage(advertiserId: string, page: number) {
  const raw = await unwrap(
    apiClient.get<ApiEnvelope<unknown>>("/admin/ads", {
      params: { advertiser_id: advertiserId, page, page_size: ADS_PAGE_SIZE },
    }),
  );
  return ListResponseSchema.parse(raw);
}

export async function listAds(advertiserId: string): Promise<{ ads: Ad[] }> {
  const first = await fetchAdsPage(advertiserId, 1);
  const ads = [...first.ads];

  const totalPages = Math.ceil(first.total / first.pageSize);
  for (let page = 2; page <= totalPages; page++) {
    const next = await fetchAdsPage(advertiserId, page);
    ads.push(...next.ads);
  }

  return { ads };
}

export async function createAd(input: CreateAdInput): Promise<Ad> {
  const raw = await unwrap(apiClient.post<ApiEnvelope<unknown>>("/admin/ads", input));
  return SingleResponseSchema.parse(raw).ad;
}

export async function updateAd(id: string, input: UpdateAdInput): Promise<Ad> {
  const raw = await unwrap(
    apiClient.patch<ApiEnvelope<unknown>>(`/admin/ads/${id}`, input),
  );
  return SingleResponseSchema.parse(raw).ad;
}

export async function deleteAd(id: string): Promise<void> {
  await apiClient.delete(`/admin/ads/${id}`);
}
