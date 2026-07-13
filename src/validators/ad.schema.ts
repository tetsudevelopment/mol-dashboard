import { z } from "zod";
import { UuidSchema } from "./common.schema";

export const AdMediaTypeSchema = z.enum(["image", "video"]);
export type AdMediaType = z.infer<typeof AdMediaTypeSchema>;

/**
 * Default duration (seconds) applied to newly-created image ads. Mirrors the
 * backend default — videos ignore this and play for the length of the file.
 */
export const DEFAULT_IMAGE_DURATION_SECONDS = 10;

// Direct-file URLs only — YouTube/Vimeo block embedded autoplay on the
// kiosk WebView, so those hosts are flagged (not blocked) in the ad form.
const UNSUPPORTED_VIDEO_HOST_REGEX = /youtube\.com|youtu\.be|vimeo\.com/i;

export function isUnsupportedVideoHost(url: string): boolean {
  return UNSUPPORTED_VIDEO_HOST_REGEX.test(url);
}

export const AdSchema = z.object({
  id: UuidSchema,
  campaign_id: UuidSchema,
  media_url: z.string(),
  media_type: AdMediaTypeSchema,
  duration_seconds: z.number().int().nullable(),
  is_active: z.boolean(),
  sort_order: z.number().int(),
});
export type Ad = z.infer<typeof AdSchema>;

export const CreateAdInputSchema = z.object({
  campaign_id: UuidSchema,
  media_url: z
    .string()
    .trim()
    .min(1, "La URL es obligatoria")
    .max(2000)
    .pipe(z.url({ protocol: /^https?$/, error: "Debe ser una URL válida (http/https)" })),
  media_type: AdMediaTypeSchema,
  duration_seconds: z.number().int().min(1).max(300).nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});
export type CreateAdInput = z.infer<typeof CreateAdInputSchema>;

// campaign_id is MUTABLE after creation (unlike the legacy advertiser_id,
// which was immutable) — mirrors the backend's UpdateAdSchema =
// CreateAdSchema.partial() (see moltech_api's ad.dto.ts). It stays a
// required-uuid field even in this partial schema, so "detaching" an ad
// (null/empty campaign_id) is rejected by construction: the caller either
// omits the field (leave as-is) or supplies a valid campaign_id to move it.
export const UpdateAdInputSchema = CreateAdInputSchema.partial();
export type UpdateAdInput = z.infer<typeof UpdateAdInputSchema>;

// The form models `duration_seconds: null` to represent "not applicable"
// for video ads (and to display an existing video ad's stored `null` back
// from the API). The backend's Zod schema is `.optional()` WITHOUT
// `.nullable()` (see moltech_api's ad.dto.ts) — it only treats `undefined`
// as "omitted", so a literal `null` on the wire fails `.min(1)` after
// `z.coerce.number()` coerces it to 0 and 400s, even though the service
// would have ignored/overridden the value for video ads anyway. Strip
// null -> undefined right before every create/update request so the key
// is dropped from the JSON body entirely (JSON.stringify drops
// `undefined`-valued properties).
export function toAdRequestBody<T extends { duration_seconds?: number | null }>(
  input: T,
): Omit<T, "duration_seconds"> & { duration_seconds?: number } {
  const { duration_seconds, ...rest } = input;
  return { ...rest, duration_seconds: duration_seconds ?? undefined };
}
