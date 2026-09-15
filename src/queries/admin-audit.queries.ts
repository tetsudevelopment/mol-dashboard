import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listAuditLog, type ListAuditFilters } from "@/api/endpoints/admin-audit";
import { queryKeys } from "./query-keys";

export function useAuditLog(filters: ListAuditFilters = {}) {
  return useQuery({
    queryKey: queryKeys.admin.audit.list(filters as Record<string, unknown>),
    queryFn: () => listAuditLog(filters),
    // Keep the current page on screen while the next one loads — otherwise
    // every page change blanks the table and flashes the loading row.
    placeholderData: keepPreviousData,
  });
}
