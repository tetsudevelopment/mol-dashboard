import { z } from "zod";
import { apiClient, unwrap } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import {
  AdvertiserSchema,
  type Advertiser,
  type CreateAdvertiserInput,
  type UpdateAdvertiserInput,
} from "@/validators/advertiser.schema";

const ListResponseSchema = z.object({
  advertisers: z.array(AdvertiserSchema),
});

const SingleResponseSchema = z.object({ advertiser: AdvertiserSchema });

export async function listAdvertisers(): Promise<{ advertisers: Advertiser[] }> {
  const raw = await unwrap(apiClient.get<ApiEnvelope<unknown>>("/admin/advertisers"));
  return ListResponseSchema.parse(raw);
}

export async function createAdvertiser(
  input: CreateAdvertiserInput,
): Promise<Advertiser> {
  const raw = await unwrap(
    apiClient.post<ApiEnvelope<unknown>>("/admin/advertisers", input),
  );
  return SingleResponseSchema.parse(raw).advertiser;
}

export async function updateAdvertiser(
  id: string,
  input: UpdateAdvertiserInput,
): Promise<Advertiser> {
  const raw = await unwrap(
    apiClient.patch<ApiEnvelope<unknown>>(`/admin/advertisers/${id}`, input),
  );
  return SingleResponseSchema.parse(raw).advertiser;
}

export async function deleteAdvertiser(id: string): Promise<void> {
  await apiClient.delete(`/admin/advertisers/${id}`);
}
