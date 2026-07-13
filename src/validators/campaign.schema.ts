import { z } from "zod";

import { UuidSchema } from "./common.schema";

export const CampaignSchema = z.object({
  id: UuidSchema,
  advertiser_id: UuidSchema,
  name: z.string(),
  weight: z.number().int(),
  is_active: z.boolean(),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const CreateCampaignInputSchema = z.object({
  advertiser_id: UuidSchema,
  name: z.string().trim().min(1).max(150),
  weight: z.number().int().min(1).max(1000).default(1),
  is_active: z.boolean().optional(),
});
export type CreateCampaignInput = z.infer<typeof CreateCampaignInputSchema>;

// advertiser_id is immutable after creation (mirrors the backend's
// UpdateCampaignSchema, which omits it) — moving a campaign to another
// advertiser is not a supported use case in this phase.
export const UpdateCampaignInputSchema = CreateCampaignInputSchema.omit({
  advertiser_id: true,
}).partial();
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignInputSchema>;

export const CampaignStationsSchema = z.object({
  station_ids: z.array(UuidSchema),
});
export type CampaignStations = z.infer<typeof CampaignStationsSchema>;
