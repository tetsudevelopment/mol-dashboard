import { z } from "zod";
import { UuidSchema } from "@/validators/common.schema";

/**
 * Admin broadcast schemas.
 *
 * Reference: moltech_api AdminNotificationsController
 * (POST /admin/notifications/broadcast).
 *
 * The dashboard consumes the wire shape as-is (no camelCase transform in
 * `unwrap`), so field names here mirror the backend exactly.
 */

/**
 * Only `promotion` and `system` are broadcastable. The backend enforces the
 * same subset — an operator must not be able to fabricate a `payment_success`
 * that the mobile app would deep-link into a payment that never happened.
 */
export const BroadcastTypeSchema = z.enum(["promotion", "system"]);
export type BroadcastType = z.infer<typeof BroadcastTypeSchema>;

export const BroadcastInputSchema = z.object({
  // Bounds mirror the backend DTO exactly so the operator gets an inline
  // error instead of a round-trip 400.
  title: z.string().trim().min(1, "El título es obligatorio").max(150),
  body: z.string().trim().min(1, "El mensaje es obligatorio").max(1000),
  type: BroadcastTypeSchema,
  /**
   * Omitted entirely = every active user. An explicit empty array is rejected
   * by the backend rather than treated as "all", because the difference
   * between those two is thousands of push notifications.
   */
  user_ids: z.array(UuidSchema).min(1).max(10_000).optional(),
});
export type BroadcastInput = z.infer<typeof BroadcastInputSchema>;

export const BroadcastResultSchema = z.object({
  recipients: z.number().int().nonnegative(),
  notificationsCreated: z.number().int().nonnegative(),
  pushSent: z.number().int().nonnegative(),
  pushFailed: z.number().int().nonnegative(),
  /** False when FCM credentials are not configured — inbox still written. */
  pushEnabled: z.boolean(),
});
export type BroadcastResult = z.infer<typeof BroadcastResultSchema>;
