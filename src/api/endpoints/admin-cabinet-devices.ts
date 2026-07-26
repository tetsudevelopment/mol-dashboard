import { z } from "zod";
import { apiClient, unwrap } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import {
  CabinetDeviceSchema,
  EjectCommandStatusSchema,
  QueuedEjectResultSchema,
  type CabinetDevice,
  type CreateCabinetDeviceInput,
  type EjectBatteryInput,
  type EjectCommandStatus,
  type QueuedEjectResult,
} from "@/validators/cabinet-device.schema";

const ListResponseSchema = z.object({ devices: z.array(CabinetDeviceSchema) });
const SingleResponseSchema = z.object({ device: CabinetDeviceSchema });
const EjectResponseSchema = z.object({ result: QueuedEjectResultSchema });
const EjectCommandStatusResponseSchema = z.object({ command: EjectCommandStatusSchema });

export async function listCabinetDevices(): Promise<CabinetDevice[]> {
  const raw = await unwrap(apiClient.get<ApiEnvelope<unknown>>("/admin/cabinet-devices"));
  return ListResponseSchema.parse(raw).devices;
}

export async function createCabinetDevice(
  input: CreateCabinetDeviceInput,
): Promise<CabinetDevice> {
  const raw = await unwrap(
    apiClient.post<ApiEnvelope<unknown>>("/admin/cabinet-devices", input),
  );
  return SingleResponseSchema.parse(raw).device;
}

/** Clears the device's claimed API key so a factory-reset cabinet can re-enroll. */
export async function releaseCabinetDevice(id: string): Promise<CabinetDevice> {
  const raw = await unwrap(
    apiClient.post<ApiEnvelope<unknown>>(`/admin/cabinet-devices/${id}/release`, {}),
  );
  return SingleResponseSchema.parse(raw).device;
}

export async function deleteCabinetDevice(id: string): Promise<void> {
  await apiClient.delete(`/admin/cabinet-devices/${id}`);
}

/**
 * Queues an eject — ops/test action, not the paid-rental flow. Executed
 * asynchronously by the cabinet app's own poll loop (see
 * AdminCabinetDevicesService.eject in moltech_api); the response is a
 * "queued" acknowledgement, not the final outcome. Poll
 * getEjectCommandStatus() with the returned command_id for completion.
 */
export async function ejectBattery(
  id: string,
  input: EjectBatteryInput,
): Promise<QueuedEjectResult> {
  const raw = await unwrap(
    apiClient.post<ApiEnvelope<unknown>>(`/admin/cabinet-devices/${id}/eject`, input),
  );
  return EjectResponseSchema.parse(raw).result;
}

/** Lightweight status poll for a previously queued eject command. */
export async function getEjectCommandStatus(
  deviceId: string,
  commandId: string,
): Promise<EjectCommandStatus> {
  const raw = await unwrap(
    apiClient.get<ApiEnvelope<unknown>>(
      `/admin/cabinet-devices/${deviceId}/eject-commands/${commandId}`,
    ),
  );
  return EjectCommandStatusResponseSchema.parse(raw).command;
}
