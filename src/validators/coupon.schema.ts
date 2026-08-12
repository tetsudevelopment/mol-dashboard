import { z } from "zod";

import { UuidSchema } from "./common.schema";

export const COUPON_DISCOUNT_TYPES = ["percentage", "fixed_amount"] as const;
export const COUPON_STATUSES = ["active", "expired", "disabled"] as const;

export const CouponDiscountTypeSchema = z.enum(COUPON_DISCOUNT_TYPES);
export const CouponStatusSchema = z.enum(COUPON_STATUSES);

export const CouponSchema = z.object({
  id: UuidSchema,
  code: z.string(),
  description: z.string().nullable(),
  discount_type: CouponDiscountTypeSchema,
  // Money on the wire is a string. Never parse it into a number for math —
  // use decimal.js if a computation is ever needed here.
  discount_value: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  max_uses: z.number().int().nullable(),
  current_uses: z.number().int(),
  status: CouponStatusSchema,
});
export type Coupon = z.infer<typeof CouponSchema>;

/**
 * Mirrors the backend's CreateCouponSchema. Two deliberate shape choices:
 *
 * - `discount_value` is a STRING, matching the wire contract. The form binds it
 *   to a text input rather than a number input so the operator's "5000.50"
 *   never round-trips through a float.
 * - the dates are `datetime-local` strings from the form, converted to ISO with
 *   an offset on submit — the backend coerces to Date and the DB column is
 *   TIMESTAMPTZ, so sending a naive local string would silently shift the
 *   window by the server's timezone.
 */
export const CreateCouponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Mínimo 3 caracteres")
      .max(50)
      .regex(/^[A-Za-z0-9_-]+$/, "Solo letras, números, guion y guion bajo")
      .transform((value) => value.toUpperCase()),
    description: z.string().trim().max(200).nullable().optional(),
    discount_type: CouponDiscountTypeSchema,
    discount_value: z
      .string()
      .trim()
      .regex(/^\d{1,8}(\.\d{1,2})?$/, "Monto con hasta 2 decimales")
      .refine((value) => /[1-9]/.test(value), "Debe ser mayor a 0"),
    start_date: z.string().min(1, "Requerido"),
    end_date: z.string().min(1, "Requerido"),
    max_uses: z.number().int().positive().max(1_000_000).nullable().optional(),
    status: CouponStatusSchema.optional(),
  })
  .refine(
    (value) => new Date(value.end_date) > new Date(value.start_date),
    { path: ["end_date"], message: "Debe ser posterior a la fecha de inicio" },
  )
  .refine(
    (value) =>
      value.discount_type !== "percentage" || !exceedsOneHundred(value.discount_value),
    { path: ["discount_value"], message: "Un porcentaje no puede pasar de 100" },
  );
export type CreateCouponInput = z.infer<typeof CreateCouponInputSchema>;

/** `code` is absent on purpose — it is printed on flyers, so it is never renamed. */
export const UpdateCouponInputSchema = z.object({
  description: z.string().trim().max(200).nullable().optional(),
  discount_type: CouponDiscountTypeSchema.optional(),
  discount_value: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  max_uses: z.number().int().positive().max(1_000_000).nullable().optional(),
  status: CouponStatusSchema.optional(),
});
export type UpdateCouponInput = z.infer<typeof UpdateCouponInputSchema>;

/**
 * Whether a `^\d{1,8}(\.\d{1,2})?$` decimal string is above 100, decided on the
 * digits. Same check the backend runs, and for the same reason: no `Number()`
 * parse of a money value, not even for a threshold.
 */
function exceedsOneHundred(decimalString: string): boolean {
  const [integerPart = "0", fraction = ""] = decimalString.split(".");
  const whole = integerPart.replace(/^0+(?=\d)/, "");
  if (whole.length > 3) return true;
  if (whole.length < 3) return false;
  if (whole !== "100") return true;
  return /[1-9]/.test(fraction);
}
