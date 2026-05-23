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
  power_bank_id: UuidSchema,
  pickup_station_id: UuidSchema,
  payment_method_id: UuidSchema,
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
