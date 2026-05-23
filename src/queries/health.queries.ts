import { useQuery } from "@tanstack/react-query";
import { getHealthLive, getHealthReady } from "@/api/endpoints/health";
import { queryKeys } from "./query-keys";

export function useHealthLive() {
  return useQuery({
    queryKey: queryKeys.health.live,
    queryFn: getHealthLive,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useHealthReady() {
  return useQuery({
    queryKey: queryKeys.health.ready,
    queryFn: getHealthReady,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
