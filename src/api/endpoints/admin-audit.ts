import { z } from "zod";
import { apiClient, unwrap } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import { AuditLogSchema, type AuditLog } from "@/validators/audit.schema";

const ListResponseSchema = z.object({
  entries: z.array(AuditLogSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export interface ListAuditFilters {
  action?: string;
  actor?: string;
  since?: string;
  until?: string;
  page?: number;
  pageSize?: number;
}

export async function listAuditLog(
  filters: ListAuditFilters = {},
): Promise<{ entries: AuditLog[]; total: number; page: number; pageSize: number }> {
  const params: Record<string, string | number> = {};
  if (filters.action !== undefined && filters.action.length > 0) params.action = filters.action;
  if (filters.actor !== undefined && filters.actor.length > 0) params.actor = filters.actor;
  if (filters.since !== undefined) params.since = filters.since;
  if (filters.until !== undefined) params.until = filters.until;
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.pageSize !== undefined) params.page_size = filters.pageSize;
  const raw = await unwrap(
    apiClient.get<ApiEnvelope<unknown>>("/admin/audit-log", { params }),
  );
  return ListResponseSchema.parse(raw);
}
