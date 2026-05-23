import { z } from "zod";

import { UuidSchema, IsoDateSchema } from "./common.schema";

export const AuditLogSchema = z.object({
  id: UuidSchema,
  action: z.string(),
  actor: z.string(),
  target_type: z.string().nullable(),
  target_id: z.string().nullable(),
  request_id: z.string().nullable(),
  ip: z.string().nullable(),
  metadata: z.unknown(),
  created_at: IsoDateSchema,
});
export type AuditLog = z.infer<typeof AuditLogSchema>;
