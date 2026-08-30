export interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  period: string;
}

export interface DatasetItem {
  id: string;
  name: string;
  sourceType: string;
  rowCount: string;
  columnCount: number;
  fileSize: string;
  lastUpdated: string;
  status: "ready" | "processing" | "error";
  qualityScore: number;
}

export interface DashboardItem {
  id: string;
  title: string;
  description: string;
  widgetsCount: number;
  datasetName: string;
  lastModified: string;
  author: string;
  tags: string[];
}

export interface DataSourceItem {
  id: string;
  name: string;
  type: string;
  host?: string;
  status: "connected" | "syncing" | "error";
  lastSync: string;
  tablesCount: number;
}

export const MOCK_METRICS: MetricCard[] = [];
export const MOCK_DATASETS: DatasetItem[] = [];
export const MOCK_DASHBOARDS: DashboardItem[] = [];
export const MOCK_DATA_SOURCES: DataSourceItem[] = [];
export const MOCK_SALES_REVENUE_SERIES: any[] = [];
