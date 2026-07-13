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
  advertiser_id: UuidSchema,
  media_url: z.string(),
  media_type: AdMediaTypeSchema,
  duration_seconds: z.number().int().nullable(),
  is_active: z.boolean(),
  sort_order: z.number().int(),
});
export type Ad = z.infer<typeof AdSchema>;

export const CreateAdInputSchema = z.object({
  advertiser_id: UuidSchema,
  media_url: z
    .string()
    .trim()
    .min(1, "La URL es obligatoria")
    .max(2000)
    .pipe(z.url({ error: "Debe ser una URL válida (http/https)" })),
  media_type: AdMediaTypeSchema,
  duration_seconds: z.number().int().min(1).max(300).nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});
export type CreateAdInput = z.infer<typeof CreateAdInputSchema>;

export const UpdateAdInputSchema = CreateAdInputSchema.omit({
  advertiser_id: true,
}).partial();
export type UpdateAdInput = z.infer<typeof UpdateAdInputSchema>;
