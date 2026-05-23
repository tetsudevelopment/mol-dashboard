import { z } from "zod";

import { UuidSchema, IsoDateSchema } from "./common.schema";
import { PowerBankStatusSchema } from "./station.schema";

export { PowerBankStatusSchema };
export type { PowerBankStatus } from "./station.schema";

export const PowerBankSchema = z.object({
  id: UuidSchema,
  code: z.string(),
  station_id: UuidSchema,
  model: z.string().nullable(),
  status: PowerBankStatusSchema,
  battery_level: z.number().int(),
  qr_code: z.string(),
  created_at: IsoDateSchema,
  updated_at: IsoDateSchema,
});
export type PowerBank = z.infer<typeof PowerBankSchema>;

export const CreatePowerBankInputSchema = z.object({
  code: z.string().trim().min(1).max(20),
  station_id: UuidSchema,
  model: z.string().trim().max(100).nullable().optional(),
  qr_code: z.string().trim().min(1).max(300),
  status: PowerBankStatusSchema.optional(),
  battery_level: z.number().int().min(0).max(100).optional(),
});
export type CreatePowerBankInput = z.infer<typeof CreatePowerBankInputSchema>;

export const UpdatePowerBankInputSchema = CreatePowerBankInputSchema.partial();
export type UpdatePowerBankInput = z.infer<typeof UpdatePowerBankInputSchema>;

export const MovePowerBankInputSchema = z.object({
  station_id: UuidSchema,
});
export type MovePowerBankInput = z.infer<typeof MovePowerBankInputSchema>;
