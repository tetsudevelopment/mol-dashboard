import { z } from "zod";
import { apiClient, unwrap } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import {
  CouponSchema,
  type Coupon,
  type CreateCouponInput,
  type UpdateCouponInput,
} from "@/validators/coupon.schema";

const ListResponseSchema = z.object({
  coupons: z.array(CouponSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export type CouponList = z.infer<typeof ListResponseSchema>;

const SingleResponseSchema = z.object({ coupon: CouponSchema });

export interface ListCouponsParams {
  status?: Coupon["status"];
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listCoupons(params: ListCouponsParams = {}): Promise<CouponList> {
  const raw = await unwrap(
    apiClient.get<ApiEnvelope<unknown>>("/admin/coupons", {
      params: {
        ...(params.status !== undefined ? { status: params.status } : {}),
        ...(params.search !== undefined && params.search !== ""
          ? { search: params.search }
          : {}),
        ...(params.page !== undefined ? { page: params.page } : {}),
        ...(params.pageSize !== undefined ? { page_size: params.pageSize } : {}),
      },
    }),
  );
  return ListResponseSchema.parse(raw);
}

export async function createCoupon(input: CreateCouponInput): Promise<Coupon> {
  const raw = await unwrap(apiClient.post<ApiEnvelope<unknown>>("/admin/coupons", input));
  return SingleResponseSchema.parse(raw).coupon;
}

export async function updateCoupon(
  id: string,
  input: UpdateCouponInput,
): Promise<Coupon> {
  const raw = await unwrap(
    apiClient.patch<ApiEnvelope<unknown>>(`/admin/coupons/${id}`, input),
  );
  return SingleResponseSchema.parse(raw).coupon;
}

export async function deleteCoupon(id: string): Promise<void> {
  await apiClient.delete(`/admin/coupons/${id}`);
}
