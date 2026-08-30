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
  sourceType: "CSV" | "PostgreSQL" | "Snowflake" | "REST API" | "JSON";
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

export const MOCK_METRICS: MetricCard[] = [
  { id: "1", title: "Total Revenue Q3", value: "$1,482,900", change: "+14.2%", isPositive: true, period: "vs Q2" },
  { id: "2", title: "Active Customer Churn", value: "2.1%", change: "-0.4%", isPositive: true, period: "vs last month" },
  { id: "3", title: "Average Order Value", value: "$142.50", change: "+5.8%", isPositive: true, period: "vs last month" },
  { id: "4", title: "Queries Executed", value: "48,290", change: "+28.1%", isPositive: true, period: "this week" },
];

export const MOCK_DATASETS: DatasetItem[] = [
  {
    id: "ds-1",
    name: "q3_global_sales_transactions.csv",
    sourceType: "CSV",
    rowCount: "248,500 rows",
    columnCount: 18,
    fileSize: "42.5 MB",
    lastUpdated: "10 mins ago",
    status: "ready",
    qualityScore: 98,
  },
  {
    id: "ds-2",
    name: "user_retention_cohorts_2026.parquet",
    sourceType: "PostgreSQL",
    rowCount: "1,200,000 rows",
    columnCount: 24,
    fileSize: "180.2 MB",
    lastUpdated: "1 hour ago",
    status: "ready",
    qualityScore: 94,
  },
  {
    id: "ds-3",
    name: "stripe_subscription_events.json",
    sourceType: "REST API",
    rowCount: "65,400 rows",
    columnCount: 14,
    fileSize: "12.8 MB",
    lastUpdated: "3 hours ago",
    status: "ready",
    qualityScore: 91,
  },
  {
    id: "ds-4",
    name: "marketing_ad_spend_all_channels.xlsx",
    sourceType: "CSV",
    rowCount: "14,200 rows",
    columnCount: 12,
    fileSize: "4.1 MB",
    lastUpdated: "Yesterday",
    status: "ready",
    qualityScore: 88,
  },
];

export const MOCK_DASHBOARDS: DashboardItem[] = [
  {
    id: "db-1",
    title: "Executive Revenue & Churn Performance",
    description: "Real-time overview of Q3 recurring revenue, customer acquisition cost, and net dollar retention.",
    widgetsCount: 8,
    datasetName: "q3_global_sales_transactions.csv",
    lastModified: "2 hours ago",
    author: "Ravi U.",
    tags: ["Sales", "Executive", "Q3"],
  },
  {
    id: "db-2",
    title: "Product Funnel & Cohort Retention",
    description: "Detailed conversion rates across signup, onboarding, trial activation, and monthly retention.",
    widgetsCount: 6,
    datasetName: "user_retention_cohorts_2026.parquet",
    lastModified: "1 day ago",
    author: "Analytics Team",
    tags: ["Product", "Retention"],
  },
  {
    id: "db-3",
    title: "Paid Acquisition CAC & ROAS breakdown",
    description: "Cross-channel analysis for Google Ads, LinkedIn, Meta, and organic growth efficiency.",
    widgetsCount: 5,
    datasetName: "marketing_ad_spend_all_channels.xlsx",
    lastModified: "3 days ago",
    author: "Growth Team",
    tags: ["Marketing", "ROI"],
  },
];

export const MOCK_DATA_SOURCES: DataSourceItem[] = [
  {
    id: "src-1",
    name: "Production Analytics Replica",
    type: "PostgreSQL DB",
    host: "db.prod.internal:5432",
    status: "connected",
    lastSync: "5 mins ago",
    tablesCount: 42,
  },
  {
    id: "src-2",
    name: "Snowflake Enterprise Warehouse",
    type: "Snowflake",
    host: "xy12345.us-east-1.snowflakecomputing.com",
    status: "connected",
    lastSync: "15 mins ago",
    tablesCount: 128,
  },
  {
    id: "src-3",
    name: "Stripe Billing Webhook Sync",
    type: "REST API",
    host: "api.stripe.com/v1",
    status: "connected",
    lastSync: "Just now",
    tablesCount: 8,
  },
  {
    id: "src-4",
    name: "Google Analytics 4 Export",
    type: "BigQuery",
    host: "bigquery.googleapis.com",
    status: "error",
    lastSync: "Failed 2 hrs ago",
    tablesCount: 14,
  },
];

export const MOCK_SALES_REVENUE_SERIES = [
  { month: "Jan", revenue: 98000, target: 90000, enterprise: 42000, selfServe: 56000 },
  { month: "Feb", revenue: 112000, target: 95000, enterprise: 51000, selfServe: 61000 },
  { month: "Mar", revenue: 125000, target: 100000, enterprise: 58000, selfServe: 67000 },
  { month: "Apr", revenue: 118000, target: 110000, enterprise: 50000, selfServe: 68000 },
  { month: "May", revenue: 140000, target: 120000, enterprise: 66000, selfServe: 74000 },
  { month: "Jun", revenue: 158000, target: 130000, enterprise: 79000, selfServe: 79000 },
  { month: "Jul", revenue: 172000, target: 140000, enterprise: 88000, selfServe: 84000 },
  { month: "Aug", revenue: 195000, target: 150000, enterprise: 104000, selfServe: 91000 },
];
