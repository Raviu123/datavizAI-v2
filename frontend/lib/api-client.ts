import axios from 'axios';
import { getRegisteredCapabilities } from '@/components/charts/registry';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const datasetApi = {
  uploadDataset: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  listDatasets: async () => {
    const response = await apiClient.get('/datasets/');
    return response.data;
  },

  deleteDataset: async (datasetId: string) => {
    const response = await apiClient.delete(`/datasets/${datasetId}`);
    return response.data;
  },

  getDatasetDetails: async (datasetId: string, limit = 100, offset = 0) => {
    const response = await apiClient.get(`/datasets/${datasetId}?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  analyzeDataset: async (datasetId: string) => {
    const capabilities = getRegisteredCapabilities();
    const response = await apiClient.post(`/datasets/${datasetId}/analyze`, {
      supported_capabilities: capabilities,
    });
    return response.data;
  },

  fetchCandidates: async (datasetId: string) => {
    const capabilities = getRegisteredCapabilities();
    const response = await apiClient.post(`/datasets/${datasetId}/candidates`, {
      supported_capabilities: capabilities,
    });
    return response.data;
  },

  generateSelectedCharts: async (datasetId: string, selectedCandidateIds: string[], customCharts?: any[]) => {
    const response = await apiClient.post(`/datasets/${datasetId}/generate-selected`, {
      selected_candidate_ids: selectedCandidateIds,
      custom_charts: customCharts,
    });
    return response.data;
  },

  chatWithData: async (datasetId: string, message: string, conversationId?: string) => {
    const response = await apiClient.post('/chat', {
      dataset_id: datasetId,
      message,
      conversation_id: conversationId,
    });
    return response.data;
  },

  streamChatWithData: async (
    datasetId: string,
    message: string,
    conversationId: string | undefined,
    onEvent: (event: any) => void,
    signal?: AbortSignal
  ) => {
    const url = `${API_BASE_URL}/chat/stream`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataset_id: datasetId,
        message,
        conversation_id: conversationId,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Chat stream failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported.');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';

      for (const chunk of chunks) {
        const trimmed = chunk.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            onEvent(data);
          } catch (e) {
            console.warn('[Chat SSE JSON parse error]', trimmed, e);
          }
        }
      }
    }

    // Flush any remaining buffer on stream termination
    if (buffer.trim().startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.trim().slice(6));
        onEvent(data);
      } catch (e) {
        console.warn('[Chat SSE JSON parse error on flush]', buffer, e);
      }
    }
  },
};

export const liveDataSourceApi = {
  listDataSources: async () => {
    const response = await apiClient.get('/data-sources');
    return response.data;
  },

  connectLiveSourceUrl: async (name: string, sourceUrl: string, refreshIntervalSeconds = 5) => {
    const response = await apiClient.post('/data-sources/connect-url', {
      name,
      source_url: sourceUrl,
      refresh_interval_seconds: refreshIntervalSeconds,
    });
    return response.data;
  },

  approveCandidates: async (sourceId: string, selectedCandidateIds: string[]) => {
    const response = await apiClient.post(`/data-sources/${sourceId}/approve-candidates`, {
      source_id: sourceId,
      selected_candidate_ids: selectedCandidateIds,
    });
    return response.data;
  },

  pollLiveDataFeed: async (sourceId: string) => {
    const response = await apiClient.get(`/data-sources/${sourceId}/poll-live-data`);
    return response.data;
  },
};

export const reportsApi = {
  generateReport: async (datasetId: string) => {
    const response = await apiClient.post(`/datasets/${datasetId}/reports/generate`);
    return response.data;
  },

  generateReportStream: async (
    datasetId: string,
    onEvent: (event: any) => void,
    signal?: AbortSignal
  ): Promise<any> => {
    const url = `${API_BASE_URL}/datasets/${datasetId}/reports/generate/stream`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json',
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to start report generation stream: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream not supported by browser.');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let finalReport: any = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';

      for (const chunk of chunks) {
        const trimmed = chunk.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            onEvent(data);
            if (data.type === 'complete' && data.report) {
              finalReport = data.report;
            } else if (data.type === 'error') {
              throw new Error(data.message || 'Pipeline encountered an error.');
            }
          } catch (err: any) {
            if (err.message && err.message.startsWith('Pipeline encountered')) {
              throw err;
            }
            console.warn('[SSE Parse Warning]', jsonStr, err);
          }
        }
      }
    }

    return finalReport;
  },

  listReports: async (datasetId: string) => {
    const response = await apiClient.get(`/datasets/${datasetId}/reports`);
    return response.data;
  },

  getReport: async (reportId: string) => {
    const response = await apiClient.get(`/reports/${reportId}`);
    return response.data;
  },
};
