import { useQuery } from "@tanstack/react-query";
import {
  loadOverview,
  type OverviewPeriod,
} from "@/api/endpoints/admin-overview";
import { queryKeys } from "./query-keys";

export function useOverview(days: OverviewPeriod) {
  return useQuery({
    queryKey: queryKeys.admin.overview.byPeriod(days),
    queryFn: () => loadOverview(days),
    // Aggregating a window costs several list requests, so avoid refetching it
    // every time the operator tabs back to the dashboard.
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
