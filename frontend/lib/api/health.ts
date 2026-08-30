import { apiClient } from "@/lib/api/client";
import { HealthResponse } from "@/types";

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>("/health");
  return data;
}
