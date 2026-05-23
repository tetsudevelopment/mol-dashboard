import { z } from "zod";
import { apiClient, unwrap } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import {
  PaymentSchema,
  type Payment,
  type PaymentStatus,
} from "@/validators/payment.schema";

const ListResponseSchema = z.object({
  payments: z.array(PaymentSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

const SingleResponseSchema = z.object({ payment: PaymentSchema });

export interface ListPaymentsFilters {
  userId?: string;
  rentalId?: string;
  status?: PaymentStatus;
  page?: number;
  pageSize?: number;
}

export async function listPayments(
  filters: ListPaymentsFilters = {},
): Promise<{ payments: Payment[]; total: number; page: number; pageSize: number }> {
  const params: Record<string, string | number> = {};
  if (filters.userId !== undefined) params.user_id = filters.userId;
  if (filters.rentalId !== undefined) params.rental_id = filters.rentalId;
  if (filters.status !== undefined) params.status = filters.status;
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.pageSize !== undefined) params.page_size = filters.pageSize;
  const raw = await unwrap(apiClient.get<ApiEnvelope<unknown>>("/admin/payments", { params }));
  return ListResponseSchema.parse(raw);
}

export async function getPayment(id: string): Promise<Payment> {
  const raw = await unwrap(apiClient.get<ApiEnvelope<unknown>>(`/admin/payments/${id}`));
  return SingleResponseSchema.parse(raw).payment;
}
