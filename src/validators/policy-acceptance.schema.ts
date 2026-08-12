import { z } from "zod";

import { UuidSchema } from "./common.schema";

export const POLICY_TYPES = ["privacy_policy", "terms_of_service"] as const;
export const PolicyTypeSchema = z.enum(POLICY_TYPES);
export type PolicyType = z.infer<typeof PolicyTypeSchema>;

export const PolicyAcceptanceSchema = z.object({
  id: UuidSchema,
  user_id: UuidSchema,
  user_name: z.string(),
  user_email: z.string().nullable(),
  // Kept as a plain string, not the enum: the backend column is a VARCHAR so
  // the list of documents can grow without a migration, and a value this build
  // does not know about must render rather than fail the whole page.
  policy_type: z.string(),
  version: z.string(),
  accepted_at: z.string(),
  ip: z.string().nullable(),
  user_agent: z.string().nullable(),
});
export type PolicyAcceptance = z.infer<typeof PolicyAcceptanceSchema>;

export const POLICY_TYPE_LABELS: Record<string, string> = {
  privacy_policy: "Política de privacidad",
  terms_of_service: "Términos y condiciones",
};

export function policyTypeLabel(policyType: string): string {
  return POLICY_TYPE_LABELS[policyType] ?? policyType;
}
