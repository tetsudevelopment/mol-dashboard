import { z } from "zod";
import { apiClient, unwrap } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import {
  PolicyAcceptanceSchema,
  type PolicyAcceptance,
} from "@/validators/policy-acceptance.schema";

const ListResponseSchema = z.object({
  acceptances: z.array(PolicyAcceptanceSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  /** Echoed by the backend so a row can be marked current vs superseded without hardcoding a version. */
  currentVersions: z.record(z.string(), z.string()),
  requiredPolicies: z.array(z.string()),
});
export type PolicyAcceptanceList = z.infer<typeof ListResponseSchema>;

export interface ListAcceptancesParams {
  userId?: string;
  policyType?: string;
  version?: string;
  page?: number;
  pageSize?: number;
}

export async function listPolicyAcceptances(
  params: ListAcceptancesParams = {},
): Promise<PolicyAcceptanceList> {
  const raw = await unwrap(
    apiClient.get<ApiEnvelope<unknown>>("/admin/policy-acceptances", {
      params: {
        ...(params.userId !== undefined ? { user_id: params.userId } : {}),
        ...(params.policyType !== undefined && params.policyType !== ""
          ? { policy_type: params.policyType }
          : {}),
        ...(params.version !== undefined && params.version !== ""
          ? { version: params.version }
          : {}),
        ...(params.page !== undefined ? { page: params.page } : {}),
        ...(params.pageSize !== undefined ? { page_size: params.pageSize } : {}),
      },
    }),
  );
  return ListResponseSchema.parse(raw);
}

export type { PolicyAcceptance };
