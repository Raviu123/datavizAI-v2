export type DatasetStatus = "uploading" | "processing" | "ready" | "failed";

export interface Dataset {
  id: string;
  name: string;
  status: DatasetStatus;
  row_count: number;
  column_count: number;
  file_size_bytes?: number;
  description?: string;
}

export interface DatasetListResponse {
  datasets: Dataset[];
  total: number;
}

export interface VisualizationSpec {
  type: "line" | "bar" | "area" | "pie" | "scatter" | "table" | "kpi";
  title?: string;
  x_axis?: { field: string; label?: string };
  y_axis?: { field: string; label?: string };
  data?: Record<string, unknown>[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  visualization?: VisualizationSpec;
  created_at: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}
