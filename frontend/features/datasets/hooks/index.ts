import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { getDatasets, getDataset, uploadDataset, deleteDataset } from "../api";

export function useDatasets() {
  return useQuery({
    queryKey: queryKeys.datasets.list(),
    queryFn: getDatasets,
  });
}

export function useDataset(id: string) {
  return useQuery({
    queryKey: queryKeys.datasets.detail(id),
    queryFn: () => getDataset(id),
    enabled: !!id,
  });
}

export function useUploadDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.datasets.list() });
    },
  });
}

export function useDeleteDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.datasets.list() });
    },
  });
}
