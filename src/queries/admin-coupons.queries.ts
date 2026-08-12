import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
  type ListCouponsParams,
} from "@/api/endpoints/admin-coupons";
import type {
  CreateCouponInput,
  UpdateCouponInput,
} from "@/validators/coupon.schema";
import { queryKeys } from "./query-keys";

export function useCoupons(params: ListCouponsParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.coupons.list(params as Record<string, unknown>),
    queryFn: () => listCoupons(params),
    // Redemption counters move as users rent, so a stale list misleads an
    // operator deciding whether a code still has uses left.
    staleTime: 10_000,
    gcTime: 5 * 60_000,
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCouponInput) => createCoupon(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.coupons.all });
    },
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCouponInput }) =>
      updateCoupon(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.coupons.all });
    },
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.coupons.all });
    },
  });
}
