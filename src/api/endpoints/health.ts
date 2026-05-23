import { z } from "zod";
import { apiClient } from "@/api/client";

// Backend health endpoints use @SkipEnvelope(), so responses are NOT wrapped in
// the standard { data, meta, error } envelope — they return the raw shape below.

const CheckStatusSchema = z.enum(["ok", "fail"]);

export const LiveResultSchema = z.object({
  status: z.literal("ok"),
});

export const ReadyResultSchema = z.object({
  status: z.enum(["ready", "not_ready"]),
  checks: z.object({
    db: CheckStatusSchema,
    redis: CheckStatusSchema,
  }),
});

export type LiveResult = z.infer<typeof LiveResultSchema>;
export type ReadyResult = z.infer<typeof ReadyResultSchema>;

export async function getHealthLive(): Promise<LiveResult> {
  const response = await apiClient.get<unknown>("/health/live");
  return LiveResultSchema.parse(response.data);
}

export async function getHealthReady(): Promise<ReadyResult> {
  const response = await apiClient.get<unknown>("/health/ready");
  return ReadyResultSchema.parse(response.data);
}
