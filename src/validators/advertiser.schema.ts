import { z } from "zod";

import { UuidSchema } from "./common.schema";

export const AdvertiserSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  weight: z.number().int(),
  is_active: z.boolean(),
});
export type Advertiser = z.infer<typeof AdvertiserSchema>;

export const CreateAdvertiserInputSchema = z.object({
  name: z.string().trim().min(1).max(150),
  weight: z.number().int().min(1).max(1000).default(1),
  is_active: z.boolean().optional(),
});
export type CreateAdvertiserInput = z.infer<typeof CreateAdvertiserInputSchema>;

export const UpdateAdvertiserInputSchema = CreateAdvertiserInputSchema.partial();
export type UpdateAdvertiserInput = z.infer<typeof UpdateAdvertiserInputSchema>;
