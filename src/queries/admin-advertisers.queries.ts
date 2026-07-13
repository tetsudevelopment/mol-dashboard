import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdvertiser,
  deleteAdvertiser,
  listAdvertisers,
  updateAdvertiser,
} from "@/api/endpoints/admin-advertisers";
import type {
  CreateAdvertiserInput,
  UpdateAdvertiserInput,
} from "@/validators/advertiser.schema";
import { queryKeys } from "./query-keys";

export function useAdvertisers() {
  return useQuery({
    queryKey: queryKeys.admin.advertisers.all,
    queryFn: listAdvertisers,
  });
}

export function useCreateAdvertiser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdvertiserInput) => createAdvertiser(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.advertisers.all });
    },
  });
}

export function useUpdateAdvertiser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAdvertiserInput }) =>
      updateAdvertiser(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.advertisers.all });
    },
  });
}

export function useDeleteAdvertiser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdvertiser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.advertisers.all });
    },
  });
}
