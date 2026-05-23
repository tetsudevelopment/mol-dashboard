import { z } from "zod";
import { apiClient, unwrap } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import {
  PowerBankSchema,
  type PowerBank,
  type PowerBankStatus,
  type CreatePowerBankInput,
  type UpdatePowerBankInput,
  type MovePowerBankInput,
} from "@/validators/power-bank.schema";

const ListResponseSchema = z.object({
  powerBanks: z.array(PowerBankSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

const SingleResponseSchema = z.object({ powerBank: PowerBankSchema });

export interface ListPowerBanksFilters {
  stationId?: string;
  status?: PowerBankStatus;
  page?: number;
  pageSize?: number;
}

export async function listPowerBanks(
  filters: ListPowerBanksFilters = {},
): Promise<{ powerBanks: PowerBank[]; total: number; page: number; pageSize: number }> {
  const params: Record<string, string | number> = {};
  if (filters.stationId !== undefined) params.station_id = filters.stationId;
  if (filters.status !== undefined) params.status = filters.status;
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.pageSize !== undefined) params.page_size = filters.pageSize;
  const raw = await unwrap(
    apiClient.get<ApiEnvelope<unknown>>("/admin/power-banks", { params }),
  );
  return ListResponseSchema.parse(raw);
}

export async function getPowerBank(id: string): Promise<PowerBank> {
  const raw = await unwrap(apiClient.get<ApiEnvelope<unknown>>(`/admin/power-banks/${id}`));
  return SingleResponseSchema.parse(raw).powerBank;
}

export async function createPowerBank(input: CreatePowerBankInput): Promise<PowerBank> {
  const raw = await unwrap(
    apiClient.post<ApiEnvelope<unknown>>("/admin/power-banks", input),
  );
  return SingleResponseSchema.parse(raw).powerBank;
}

export async function updatePowerBank(
  id: string,
  input: UpdatePowerBankInput,
): Promise<PowerBank> {
  const raw = await unwrap(
    apiClient.patch<ApiEnvelope<unknown>>(`/admin/power-banks/${id}`, input),
  );
  return SingleResponseSchema.parse(raw).powerBank;
}

export async function movePowerBank(
  id: string,
  input: MovePowerBankInput,
): Promise<PowerBank> {
  const raw = await unwrap(
    apiClient.post<ApiEnvelope<unknown>>(`/admin/power-banks/${id}/move`, input),
  );
  return SingleResponseSchema.parse(raw).powerBank;
}

export async function deletePowerBank(id: string): Promise<void> {
  await apiClient.delete(`/admin/power-banks/${id}`);
}
