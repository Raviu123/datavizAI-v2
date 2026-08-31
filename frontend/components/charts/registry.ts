/**
 * Frontend Chart Registry Layer
 * Registers all available modular chart types and capabilities supported by the frontend engine.
 */

export interface RegisteredChartCapability {
  type: string;
  name: string;
  description: string;
  supportedAxes: string[];
  supportedAggregations: string[];
  features: string[];
}

export const CHART_REGISTRY: Record<string, RegisteredChartCapability> = {
  bar: {
    type: 'bar',
    name: 'Bar Chart',
    description: 'Compares numeric values across discrete categories (Grouped or Stacked)',
    supportedAxes: ['category', 'numeric'],
    supportedAggregations: ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'],
    features: ['stacked', 'horizontal', 'multi-series']
  },
  line: {
    type: 'line',
    name: 'Line Chart',
    description: 'Tracks temporal trends and continuous metric changes over time',
    supportedAxes: ['datetime', 'numeric'],
    supportedAggregations: ['SUM', 'AVG', 'MIN', 'MAX'],
    features: ['monotone', 'multi-series', 'active-dots']
  },
  area: {
    type: 'area',
    name: 'Area Chart',
    description: 'Visualizes volume and cumulative trend progression with gradient shading',
    supportedAxes: ['datetime', 'category', 'numeric'],
    supportedAggregations: ['SUM', 'AVG', 'MIN', 'MAX'],
    features: ['gradient-fill', 'stacked', 'multi-series']
  },
  pie: {
    type: 'pie',
    name: 'Pie Chart',
    description: 'Displays proportional composition share of categorical segments',
    supportedAxes: ['category', 'numeric'],
    supportedAggregations: ['SUM', 'COUNT'],
    features: ['slice-labels', 'hover-expansion']
  },
  donut: {
    type: 'donut',
    name: 'Donut Chart',
    description: 'Ring donut diagram showing relative market/category percentage shares',
    supportedAxes: ['category', 'numeric'],
    supportedAggregations: ['SUM', 'COUNT'],
    features: ['center-hole', 'slice-padding', 'percentage-labels']
  },
  scatter: {
    type: 'scatter',
    name: 'Scatter Plot',
    description: 'Illustrates correlation and cluster patterns between two continuous variables',
    supportedAxes: ['numeric', 'numeric'],
    supportedAggregations: ['NONE', 'AVG'],
    features: ['point-clustering', 'two-variable-correlation']
  },
  radar: {
    type: 'radar',
    name: 'Radar Chart',
    description: 'Multivariate polar grid mapping performance metrics across multiple axes',
    supportedAxes: ['category', 'numeric'],
    supportedAggregations: ['AVG', 'SUM'],
    features: ['polar-grid', 'multi-metric-overlay']
  },
  composed: {
    type: 'composed',
    name: 'Composed Bar + Line Chart',
    description: 'Dual-axis hybrid visualization combining bar metrics with trend lines',
    supportedAxes: ['category', 'datetime', 'numeric'],
    supportedAggregations: ['SUM', 'AVG', 'COUNT'],
    features: ['dual-axis', 'bar-line-hybrid', 'multi-series']
  },
  treemap: {
    type: 'treemap',
    name: 'Treemap Hierarchy',
    description: 'Nested rectangular layout representing hierarchical proportional data volume',
    supportedAxes: ['category', 'numeric'],
    supportedAggregations: ['SUM', 'COUNT'],
    features: ['nested-tiles', 'proportional-scaling', 'color-intensity']
  },
  funnel: {
    type: 'funnel',
    name: 'Funnel Stage Chart',
    description: 'Visualizes stage-by-stage process conversion drop-offs and throughput retention',
    supportedAxes: ['category', 'numeric'],
    supportedAggregations: ['SUM', 'COUNT'],
    features: ['conversion-stages', 'tapered-bars', 'dropoff-analysis']
  },
  gauge: {
    type: 'gauge',
    name: 'Gauge Target Dial',
    description: 'Radial meter displaying key target progress and operational thresholds',
    supportedAxes: ['numeric'],
    supportedAggregations: ['SUM', 'AVG'],
    features: ['progress-arc', 'target-indicator', 'threshold-status']
  },
  bubble: {
    type: 'bubble',
    name: '3D Bubble Plot',
    description: 'Scatter plot extended with bubble radius reflecting a 3rd dimension metric',
    supportedAxes: ['numeric', 'numeric', 'numeric'],
    supportedAggregations: ['AVG', 'SUM', 'NONE'],
    features: ['3D-metric-z-axis', 'variable-radii', 'cluster-scatter']
  },
  kpi: {
    type: 'kpi',
    name: 'KPI Summary Metric Card',
    description: 'Displays high-level executive primary totals, averages, and trend indicators',
    supportedAxes: ['numeric'],
    supportedAggregations: ['SUM', 'AVG', 'COUNT'],
    features: ['single-metric', 'trend-badge', 'subtext-summary']
  }
};

export function getRegisteredCapabilities(): RegisteredChartCapability[] {
  return Object.values(CHART_REGISTRY);
}

export function getSupportedChartTypes(): string[] {
  return Object.keys(CHART_REGISTRY);
}
