import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPowerBank,
  deletePowerBank,
  getPowerBank,
  listPowerBanks,
  movePowerBank,
  updatePowerBank,
  type ListPowerBanksFilters,
} from "@/api/endpoints/admin-power-banks";
import type {
  CreatePowerBankInput,
  MovePowerBankInput,
  UpdatePowerBankInput,
} from "@/validators/power-bank.schema";
import { queryKeys } from "./query-keys";

export function usePowerBanks(filters: ListPowerBanksFilters = {}) {
  return useQuery({
    queryKey: queryKeys.admin.powerBanks.list(filters as Record<string, unknown>),
    queryFn: () => listPowerBanks(filters),
  });
}

export function usePowerBank(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.admin.powerBanks.byId(id) : ["admin", "power-banks", "none"],
    queryFn: () => getPowerBank(id as string),
    enabled: Boolean(id),
  });
}

export function useCreatePowerBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePowerBankInput) => createPowerBank(input),
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.powerBanks.all });
      qc.invalidateQueries({ queryKey: queryKeys.admin.stations.state(input.station_id) });
    },
  });
}

export function useUpdatePowerBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePowerBankInput }) =>
      updatePowerBank(id, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.powerBanks.all });
      qc.invalidateQueries({ queryKey: queryKeys.admin.powerBanks.byId(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.admin.stations.all });
    },
  });
}

export function useMovePowerBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MovePowerBankInput }) =>
      movePowerBank(id, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.powerBanks.all });
      qc.invalidateQueries({ queryKey: queryKeys.admin.powerBanks.byId(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.admin.stations.all });
    },
  });
}

export function useDeletePowerBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePowerBank(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.powerBanks.all });
      qc.invalidateQueries({ queryKey: queryKeys.admin.stations.all });
    },
  });
}
