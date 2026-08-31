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
};
