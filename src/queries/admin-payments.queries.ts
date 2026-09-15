import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getPayment,
  listPayments,
  type ListPaymentsFilters,
} from "@/api/endpoints/admin-payments";
import { queryKeys } from "./query-keys";

export function usePayments(filters: ListPaymentsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.admin.payments.list(filters as Record<string, unknown>),
    queryFn: () => listPayments(filters),
    // Keep the current page on screen while the next one loads — otherwise
    // every page change blanks the table and flashes the loading row.
    placeholderData: keepPreviousData,
  });
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.admin.payments.byId(id) : ["admin", "payments", "none"],
    queryFn: () => getPayment(id as string),
    enabled: Boolean(id),
  });
}
