import { z } from "zod";

import { UuidSchema, IsoDateSchema } from "./common.schema";

/**
 * A physical power-bank cabinet self-enrolls: an admin pre-registers its
 * hardware id (device_id, printed on the unit) against a station, then the
 * cabinet claims its own API key automatically via zero-touch enrollment
 * (POST /devices/enroll on the backend — not exposed here). `enrolled_at`
 * stays null until that claim happens.
 */
export const CabinetDeviceSchema = z.object({
  id: UuidSchema,
  station_id: UuidSchema,
  device_id: z.string(),
  enrolled_at: IsoDateSchema.nullable(),
  last_seen_at: IsoDateSchema.nullable(),
  model: z.string().nullable(),
  slot_count: z.number().int().nullable(),
  firmware: z.string().nullable(),
});
export type CabinetDevice = z.infer<typeof CabinetDeviceSchema>;

export const CreateCabinetDeviceInputSchema = z.object({
  station_id: UuidSchema,
  device_id: z.string().trim().min(1).max(100),
});
export type CreateCabinetDeviceInput = z.infer<typeof CreateCabinetDeviceInputSchema>;

/**
 * POST /admin/cabinet-devices/{id}/eject payload. Historically mirrored
 * cabinet-service's own eject body 1:1 for a direct proxy call; as of the
 * eject-through-poller rework (moltech_api docs/API_CONTRACT.md §7.10) the
 * backend enqueues a command instead and the cabinet app's own poll loop
 * executes it — that loop never reads slot/battery_id/min_charge, so these
 * fields are accepted for audit/diagnostics only and NOT enforced. The modal
 * does not collect them; kept here (all optional) for API compatibility.
 */
export const EjectBatteryInputSchema = z.object({
  slot: z.number().int().positive().optional(),
  battery_id: z.string().trim().min(1).max(100).optional(),
  min_charge: z.number().int().min(0).max(100).optional(),
});
export type EjectBatteryInput = z.infer<typeof EjectBatteryInputSchema>;

/** Response of POST /admin/cabinet-devices/{id}/eject — enqueued, not yet executed. */
export const QueuedEjectResultSchema = z.object({
  status: z.literal("queued"),
  command_id: UuidSchema,
  expires_at: IsoDateSchema,
});
export type QueuedEjectResult = z.infer<typeof QueuedEjectResultSchema>;

export const EjectCommandStatusEnum = z.enum(["pending", "dispensed", "failed", "expired"]);
export type EjectCommandStatusValue = z.infer<typeof EjectCommandStatusEnum>;

/** GET /admin/cabinet-devices/{id}/eject-commands/{commandId} — lightweight completion poll. */
export const EjectCommandStatusSchema = z.object({
  id: UuidSchema,
  status: EjectCommandStatusEnum,
  dispensed_battery_id: z.string().nullable(),
  dispensed_at: IsoDateSchema.nullable(),
  expires_at: IsoDateSchema,
  created_at: IsoDateSchema,
});
export type EjectCommandStatus = z.infer<typeof EjectCommandStatusSchema>;

/** A pre-registered device is "enrolled" once the cabinet has claimed its API key. */
export function isCabinetEnrolled(device: Pick<CabinetDevice, "enrolled_at">): boolean {
  return device.enrolled_at !== null;
}

/** A cabinet counts as online when it last checked in within this window. */
export const CABINET_ONLINE_WINDOW_MS = 5 * 60 * 1000;

export function isCabinetOnline(
  device: Pick<CabinetDevice, "last_seen_at">,
  now: Date = new Date(),
): boolean {
  if (!device.last_seen_at) return false;
  return now.getTime() - new Date(device.last_seen_at).getTime() <= CABINET_ONLINE_WINDOW_MS;
}
