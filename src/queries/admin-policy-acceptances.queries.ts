import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  listPolicyAcceptances,
  type ListAcceptancesParams,
} from "@/api/endpoints/admin-policy-acceptances";
import { queryKeys } from "./query-keys";

export function usePolicyAcceptances(params: ListAcceptancesParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.policyAcceptances.list(params as Record<string, unknown>),
    queryFn: () => listPolicyAcceptances(params),
    // Keep the current page on screen while the next one loads — otherwise
    // every page change blanks the table and flashes the loading row.
    placeholderData: keepPreviousData,
    // An append-only audit trail: rows never change, only new ones arrive.
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
