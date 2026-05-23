import { z } from "zod";
import { apiClient, unwrap } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import {
  StationSchema,
  StationStateSchema,
  type Station,
  type StationState,
  type CreateStationInput,
  type UpdateStationInput,
} from "@/validators/station.schema";

const ListResponseSchema = z.object({
  stations: z.array(StationSchema),
  total: z.number().int(),
});

const SingleResponseSchema = z.object({ station: StationSchema });

export async function listStations(): Promise<{ stations: Station[]; total: number }> {
  const raw = await unwrap(apiClient.get<ApiEnvelope<unknown>>("/admin/stations"));
  return ListResponseSchema.parse(raw);
}

export async function getStation(id: string): Promise<Station> {
  const raw = await unwrap(apiClient.get<ApiEnvelope<unknown>>(`/admin/stations/${id}`));
  return SingleResponseSchema.parse(raw).station;
}

export async function getStationState(id: string): Promise<StationState> {
  const raw = await unwrap(
    apiClient.get<ApiEnvelope<unknown>>(`/admin/stations/${id}/state`),
  );
  return StationStateSchema.parse(raw);
}

export async function createStation(input: CreateStationInput): Promise<Station> {
  const raw = await unwrap(
    apiClient.post<ApiEnvelope<unknown>>("/admin/stations", input),
  );
  return SingleResponseSchema.parse(raw).station;
}

export async function updateStation(
  id: string,
  input: UpdateStationInput,
): Promise<Station> {
  const raw = await unwrap(
    apiClient.patch<ApiEnvelope<unknown>>(`/admin/stations/${id}`, input),
  );
  return SingleResponseSchema.parse(raw).station;
}

export async function deleteStation(id: string): Promise<void> {
  await apiClient.delete(`/admin/stations/${id}`);
}
