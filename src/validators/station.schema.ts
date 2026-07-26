import { z } from "zod";

import { UuidSchema, DecimalStringSchema, IsoDateSchema } from "./common.schema";

export const StationStatusSchema = z.enum(["online", "offline", "maintenance"]);
export type StationStatus = z.infer<typeof StationStatusSchema>;

export const PowerBankStatusSchema = z.enum([
  "available",
  "rented",
  "charging",
  "damaged",
  "retired",
]);
export type PowerBankStatus = z.infer<typeof PowerBankStatusSchema>;

/**
 * Hard cap on power banks per station. Mirrors the backend constant of the
 * same name. The dashboard uses this to render "X/10" badges and disable
 * add/move actions before the user even submits.
 */
export const MAX_POWER_BANKS_PER_STATION = 10;

export const StationSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  city: z.string(),
  address: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  hourly_rate: DecimalStringSchema,
  currency: z.string(),
  total_capacity: z.number().int(),
  status: StationStatusSchema,
  created_at: IsoDateSchema,
  power_banks_count: z.number().int(),
});
export type Station = z.infer<typeof StationSchema>;

export function isStationFull(station: { power_banks_count: number }): boolean {
  return station.power_banks_count >= MAX_POWER_BANKS_PER_STATION;
}

export const PowerBankAtStationSchema = z.object({
  id: UuidSchema,
  code: z.string(),
  model: z.string().nullable(),
  status: PowerBankStatusSchema,
  battery_level: z.number().int(),
  qr_code: z.string(),
  created_at: IsoDateSchema,
  updated_at: IsoDateSchema,
});
export type PowerBankAtStation = z.infer<typeof PowerBankAtStationSchema>;

export const StationStateSchema = z.object({
  station: StationSchema,
  power_banks: z.array(PowerBankAtStationSchema),
  summary: z.object({
    total: z.number().int(),
    available: z.number().int(),
    rented: z.number().int(),
    charging: z.number().int(),
    damaged: z.number().int(),
    retired: z.number().int(),
  }),
});
export type StationState = z.infer<typeof StationStateSchema>;

export const CreateStationInputSchema = z.object({
  name: z.string().trim().min(1).max(150),
  city: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  hourly_rate: z.number().positive(),
  currency: z.string().length(3).default("COP"),
  total_capacity: z.number().int().min(0).max(1000).default(0),
  status: StationStatusSchema.default("online"),
});
export type CreateStationInput = z.infer<typeof CreateStationInputSchema>;

export const UpdateStationInputSchema = CreateStationInputSchema.partial();
export type UpdateStationInput = z.infer<typeof UpdateStationInputSchema>;
