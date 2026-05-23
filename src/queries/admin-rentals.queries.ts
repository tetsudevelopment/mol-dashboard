import { useQuery } from "@tanstack/react-query";
import {
  getRental,
  listRentals,
  type ListRentalsFilters,
} from "@/api/endpoints/admin-rentals";
import { queryKeys } from "./query-keys";

export function useRentals(filters: ListRentalsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.admin.rentals.list(filters as Record<string, unknown>),
    queryFn: () => listRentals(filters),
  });
}

export function useRental(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.admin.rentals.byId(id) : ["admin", "rentals", "none"],
    queryFn: () => getRental(id as string),
    enabled: Boolean(id),
  });
}
