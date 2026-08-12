import { apiClient, unwrap } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import {
  BroadcastResultSchema,
  type BroadcastInput,
  type BroadcastResult,
} from "@/validators/notification.schema";

/**
 * Sends a notification to a set of users, or to every active user when
 * `user_ids` is omitted.
 *
 * Writes one inbox row per recipient first, then attempts FCM delivery — so a
 * `pushSent: 0` in the result does NOT mean the message was lost, only that
 * it will be seen in-app rather than as a push.
 */
export async function broadcastNotification(
  input: BroadcastInput,
): Promise<BroadcastResult> {
  const raw = await unwrap(
    apiClient.post<ApiEnvelope<unknown>>("/admin/notifications/broadcast", {
      title: input.title,
      body: input.body,
      type: input.type,
      // Sent only when targeting: the backend reads "key absent" as
      // "everyone", and an explicit empty array as a validation error.
      ...(input.user_ids !== undefined ? { user_ids: input.user_ids } : {}),
    }),
  );
  return BroadcastResultSchema.parse(raw);
}
