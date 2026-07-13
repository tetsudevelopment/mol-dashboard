import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAd, deleteAd, listAds, updateAd } from "@/api/endpoints/admin-ads";
import type { CreateAdInput, UpdateAdInput } from "@/validators/ad.schema";
import { queryKeys } from "./query-keys";

/**
 * Shared query options for an advertiser's ads. Exported so callers that need
 * several advertisers at once (the rotation preview, the ad-count column) can
 * feed them into `useQueries` and share the cache with `useAds`.
 */
export function adsQueryOptions(advertiserId: string) {
  return {
    queryKey: queryKeys.admin.ads.byAdvertiser(advertiserId),
    queryFn: () => listAds(advertiserId),
  };
}

export function useAds(advertiserId: string | undefined) {
  return useQuery({
    queryKey: advertiserId
      ? queryKeys.admin.ads.byAdvertiser(advertiserId)
      : ["admin", "ads", "none"],
    queryFn: () => listAds(advertiserId as string),
    enabled: Boolean(advertiserId),
  });
}

export function useCreateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdInput) => createAd(input),
    onSuccess: (_, input) => {
      qc.invalidateQueries({
        queryKey: queryKeys.admin.ads.byAdvertiser(input.advertiser_id),
      });
    },
  });
}

export function useUpdateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      advertiserId: string;
      input: UpdateAdInput;
    }) => updateAd(id, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: queryKeys.admin.ads.byAdvertiser(vars.advertiserId),
      });
    },
  });
}

export function useDeleteAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; advertiserId: string }) => deleteAd(id),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: queryKeys.admin.ads.byAdvertiser(vars.advertiserId),
      });
    },
  });
}
