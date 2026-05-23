import { z } from "zod";
import { apiClient, unwrap } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import {
  RentalSchema,
  type Rental,
  type RentalStatus,
} from "@/validators/rental.schema";

const ListResponseSchema = z.object({
  rentals: z.array(RentalSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

const SingleResponseSchema = z.object({ rental: RentalSchema });

export interface ListRentalsFilters {
  userId?: string;
  stationId?: string;
  status?: RentalStatus;
  page?: number;
  pageSize?: number;
}

export async function listRentals(
  filters: ListRentalsFilters = {},
): Promise<{ rentals: Rental[]; total: number; page: number; pageSize: number }> {
  const params: Record<string, string | number> = {};
  if (filters.userId !== undefined) params.user_id = filters.userId;
  if (filters.stationId !== undefined) params.station_id = filters.stationId;
  if (filters.status !== undefined) params.status = filters.status;
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.pageSize !== undefined) params.page_size = filters.pageSize;
  const raw = await unwrap(apiClient.get<ApiEnvelope<unknown>>("/admin/rentals", { params }));
  return ListResponseSchema.parse(raw);
}

export async function getRental(id: string): Promise<Rental> {
  const raw = await unwrap(apiClient.get<ApiEnvelope<unknown>>(`/admin/rentals/${id}`));
  return SingleResponseSchema.parse(raw).rental;
}
