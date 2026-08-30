import { apiClient } from "@/lib/api/client";
import { Dataset, DatasetListResponse } from "@/types";

export async function getDatasets(): Promise<DatasetListResponse> {
  const { data } = await apiClient.get<DatasetListResponse>("/datasets");
  return data;
}

export async function getDataset(id: string): Promise<Dataset> {
  const { data } = await apiClient.get<Dataset>(`/datasets/${id}`);
  return data;
}

export async function uploadDataset(file: File): Promise<Dataset> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<Dataset>("/datasets", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteDataset(id: string): Promise<void> {
  await apiClient.delete(`/datasets/${id}`);
}
