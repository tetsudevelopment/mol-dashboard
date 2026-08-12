import { useMutation, useQueryClient } from "@tanstack/react-query";
import { broadcastNotification } from "@/api/endpoints/admin-notifications";
import type { BroadcastInput } from "@/validators/notification.schema";
import { queryKeys } from "./query-keys";

/**
 * Fires a broadcast.
 *
 * Deliberately NOT wrapped in optimistic UI: this is a one-shot, irreversible
 * action reaching every customer's phone, so the operator must see the real
 * server-reported counts, never a predicted one.
 *
 * Invalidates the audit log because every broadcast writes an
 * `admin.notification.broadcast` entry the Audit page should surface
 * immediately.
 */
export function useBroadcastNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BroadcastInput) => broadcastNotification(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.audit.all });
    },
  });
}
