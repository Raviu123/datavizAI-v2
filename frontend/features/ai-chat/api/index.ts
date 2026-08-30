import { apiClient } from "@/lib/api/client";

interface ChatRequest {
  dataset_id: string;
  message: string;
  conversation_id?: string;
}

interface ChatResponse {
  conversation_id: string;
  message: string;
  visualization?: {
    type: string;
    title?: string;
    data?: unknown[];
  };
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>("/chat", request);
  return data;
}
