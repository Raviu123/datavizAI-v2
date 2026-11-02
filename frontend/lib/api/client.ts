import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { API_BASE_URL } from "@/lib/api-client";

export { API_BASE_URL };

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });

  // Request interceptor: add auth token
  client.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor: normalize errors
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      const message =
        (error.response?.data as { detail?: string })?.detail ??
        error.message ??
        "An unexpected error occurred";
      return Promise.reject(new Error(message));
    }
  );

  return client;
}

export const apiClient = createApiClient();
