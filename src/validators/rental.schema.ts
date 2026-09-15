import { z } from "zod";

import { UuidSchema, DecimalStringSchema, IsoDateSchema } from "./common.schema";

export const RentalStatusSchema = z.enum([
  "active",
  "completed",
  "cancelled",
  "penalized",
]);
export type RentalStatus = z.infer<typeof RentalStatusSchema>;

export const RentalSchema = z.object({
  id: UuidSchema,
  user_id: UuidSchema,
  // Nullable: a rental is created the moment the charge is authorized, before
  // any battery is dispensed. The cabinet claims a power bank afterwards via
  // the devices API, so the API emits null until that happens.
  power_bank_id: UuidSchema.nullable(),
  pickup_station_id: UuidSchema,
  // Nullable since 2026-08-30: a rental whose coupon covers 100% of the cost
  // never touches the payment gateway, so it can be created by a user with no
  // card on file. The API emits null for those.
  payment_method_id: UuidSchema.nullable(),
  coupon_id: UuidSchema.nullable(),
  start_time: IsoDateSchema,
  end_time: IsoDateSchema.nullable(),
  estimated_duration_hours: z.number().int(),
  actual_duration_hours: DecimalStringSchema.nullable(),
  hourly_rate: DecimalStringSchema,
  estimated_cost: DecimalStringSchema,
  final_cost: DecimalStringSchema.nullable(),
  currency: z.string(),
  discount_applied: DecimalStringSchema,
  penalty: DecimalStringSchema,
  status: RentalStatusSchema,
  created_at: IsoDateSchema,
});
export type Rental = z.infer<typeof RentalSchema>;
