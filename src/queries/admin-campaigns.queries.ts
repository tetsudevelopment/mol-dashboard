import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCampaign,
  createCampaignAd,
  deleteCampaign,
  deleteCampaignAd,
  getCampaign,
  listCampaignAds,
  listCampaignStations,
  listCampaigns,
  replaceCampaignStations,
  unassignCampaignStation,
  updateCampaign,
  updateCampaignAd,
} from "@/api/endpoints/admin-campaigns";
import type {
  CreateCampaignInput,
  UpdateCampaignInput,
} from "@/validators/campaign.schema";
import type { CreateAdInput, UpdateAdInput } from "@/validators/ad.schema";
import { queryKeys } from "./query-keys";

export function useCampaigns() {
  return useQuery({
    queryKey: queryKeys.admin.campaigns.all,
    queryFn: () => listCampaigns(),
  });
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.admin.campaigns.byId(id) : ["admin", "campaigns", "none"],
    queryFn: () => getCampaign(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCampaignInput) => createCampaign(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.campaigns.all });
    },
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCampaignInput }) =>
      updateCampaign(id, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.campaigns.all });
      qc.invalidateQueries({ queryKey: queryKeys.admin.campaigns.byId(vars.id) });
    },
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.campaigns.all });
    },
  });
}

/**
 * Shared query options for a campaign's ads. Exported so callers that need
 * several campaigns at once (the ad-count column, the rotation preview) can
 * feed them into `useQueries` and share the cache with `useCampaignAds`.
 */
export function campaignAdsQueryOptions(campaignId: string) {
  return {
    queryKey: queryKeys.admin.campaigns.ads(campaignId),
    queryFn: () => listCampaignAds(campaignId),
  };
}

export function useCampaignAds(campaignId: string | undefined) {
  return useQuery({
    queryKey: campaignId
      ? queryKeys.admin.campaigns.ads(campaignId)
      : ["admin", "campaigns", "none", "ads"],
    queryFn: () => listCampaignAds(campaignId as string),
    enabled: Boolean(campaignId),
  });
}

export function useCreateCampaignAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, input }: { campaignId: string; input: CreateAdInput }) =>
      createCampaignAd(campaignId, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.campaigns.ads(vars.campaignId) });
    },
  });
}

export function useUpdateCampaignAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      campaignId: string;
      input: UpdateAdInput;
    }) => updateCampaignAd(id, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.campaigns.ads(vars.campaignId) });
    },
  });
}

export function useDeleteCampaignAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; campaignId: string }) => deleteCampaignAd(id),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.campaigns.ads(vars.campaignId) });
    },
  });
}

export function useCampaignStations(campaignId: string | undefined) {
  return useQuery({
    queryKey: campaignId
      ? queryKeys.admin.campaigns.stations(campaignId)
      : ["admin", "campaigns", "none", "stations"],
    queryFn: () => listCampaignStations(campaignId as string),
    enabled: Boolean(campaignId),
  });
}

export function useReplaceCampaignStations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      stationIds,
    }: {
      campaignId: string;
      stationIds: string[];
    }) => replaceCampaignStations(campaignId, stationIds),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.campaigns.stations(vars.campaignId) });
    },
  });
}

export function useUnassignCampaignStation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, stationId }: { campaignId: string; stationId: string }) =>
      unassignCampaignStation(campaignId, stationId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.campaigns.stations(vars.campaignId) });
    },
  });
}
