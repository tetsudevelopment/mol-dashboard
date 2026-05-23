import { useQuery } from "@tanstack/react-query";
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
  });
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.admin.payments.byId(id) : ["admin", "payments", "none"],
    queryFn: () => getPayment(id as string),
    enabled: Boolean(id),
  });
}
