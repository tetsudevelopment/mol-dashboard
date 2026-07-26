import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCabinetDevice,
  deleteCabinetDevice,
  ejectBattery,
  getEjectCommandStatus,
  listCabinetDevices,
  releaseCabinetDevice,
} from "@/api/endpoints/admin-cabinet-devices";
import type {
  CreateCabinetDeviceInput,
  EjectBatteryInput,
} from "@/validators/cabinet-device.schema";
import { queryKeys } from "./query-keys";

/** Cabinet polls every 2.5s (see moltech_api PendingDispensePoller); match that cadence here. */
const EJECT_STATUS_POLL_MS = 2_500;

export function useCabinetDevices() {
  return useQuery({
    queryKey: queryKeys.admin.cabinetDevices.all,
    queryFn: listCabinetDevices,
  });
}

export function useCreateCabinetDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCabinetDeviceInput) => createCabinetDevice(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.cabinetDevices.all });
    },
  });
}

export function useReleaseCabinetDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => releaseCabinetDevice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.cabinetDevices.all });
    },
  });
}

export function useDeleteCabinetDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCabinetDevice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.cabinetDevices.all });
    },
  });
}

/**
 * Queues an eject on the device's cabinet — an ops/test action, not the
 * paid-rental flow. Resolves with { status: 'queued', command_id, expires_at }
 * as soon as the backend accepts it; the physical eject happens later, once
 * the cabinet's own poll loop picks the command up. No cabinet_devices field
 * changes as a result, so no query invalidation is needed. Pass the
 * resulting command_id to useEjectCommandStatus to learn the outcome.
 */
export function useEjectBattery() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EjectBatteryInput }) =>
      ejectBattery(id, input),
  });
}

/**
 * Polls a queued eject command's status every 2.5s (matching the cabinet's
 * own poll cadence) until it leaves 'pending' (dispensed/failed) or its TTL
 * elapses (expired) — then stops. `enabled` gates it on having a command_id
 * (i.e. only after useEjectBattery resolves).
 */
export function useEjectCommandStatus(
  deviceId: string | undefined,
  commandId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.admin.cabinetDevices.ejectCommand(deviceId ?? "", commandId ?? ""),
    queryFn: () => getEjectCommandStatus(deviceId as string, commandId as string),
    enabled: Boolean(deviceId) && Boolean(commandId),
    refetchInterval: (query) =>
      query.state.data?.status === "pending" ? EJECT_STATUS_POLL_MS : false,
  });
}
