import { z } from "zod";

import { UuidSchema, DecimalStringSchema, IsoDateSchema } from "./common.schema";

export const PaymentStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "refunded",
  "error",
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentConceptSchema = z.enum(["rental", "penalty", "refund"]);
export type PaymentConcept = z.infer<typeof PaymentConceptSchema>;

export const PaymentGatewaySchema = z.enum([
  "wompi",
  "payu",
  "mercadopago",
  "stripe",
  "other",
]);
export type PaymentGateway = z.infer<typeof PaymentGatewaySchema>;

export const PaymentSchema = z.object({
  id: UuidSchema,
  rental_id: UuidSchema,
  user_id: UuidSchema,
  payment_method_id: UuidSchema.nullable(),
  concept: PaymentConceptSchema,
  amount: DecimalStringSchema,
  currency: z.string(),
  gateway: PaymentGatewaySchema,
  transaction_id: z.string(),
  merchant_id: z.string().nullable(),
  status: PaymentStatusSchema,
  gateway_message: z.string().nullable(),
  attempted_at: IsoDateSchema,
  updated_at: IsoDateSchema,
});
export type Payment = z.infer<typeof PaymentSchema>;
