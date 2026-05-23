import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStation,
  deleteStation,
  getStation,
  getStationState,
  listStations,
  updateStation,
} from "@/api/endpoints/admin-stations";
import type {
  CreateStationInput,
  UpdateStationInput,
} from "@/validators/station.schema";
import { queryKeys } from "./query-keys";

export function useStations() {
  return useQuery({
    queryKey: queryKeys.admin.stations.all,
    queryFn: listStations,
  });
}

export function useStation(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.admin.stations.byId(id) : ["admin", "stations", "none"],
    queryFn: () => getStation(id as string),
    enabled: Boolean(id),
  });
}

export function useStationState(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.admin.stations.state(id) : ["admin", "stations", "none", "state"],
    queryFn: () => getStationState(id as string),
    enabled: Boolean(id),
    refetchInterval: 10_000,
  });
}

export function useCreateStation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStationInput) => createStation(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.stations.all });
    },
  });
}

export function useUpdateStation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStationInput }) =>
      updateStation(id, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.stations.all });
      qc.invalidateQueries({ queryKey: queryKeys.admin.stations.byId(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.admin.stations.state(vars.id) });
    },
  });
}

export function useDeleteStation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.stations.all });
    },
  });
}
