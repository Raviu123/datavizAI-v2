import React, { useState } from 'react';
import { BarChartComponent } from './BarChartComponent';
import { LineChartComponent } from './LineChartComponent';
import { AreaChartComponent } from './AreaChartComponent';
import { PieDonutChartComponent } from './PieDonutChartComponent';
import { ScatterPlotComponent } from './ScatterPlotComponent';
import { RadarChartComponent } from './RadarChartComponent';
import { ComposedChartComponent } from './ComposedChartComponent';
import { KpiCardComponent } from './KpiCardComponent';
import { TreemapComponent } from './TreemapComponent';
import { FunnelComponent } from './FunnelComponent';
import { GaugeComponent } from './GaugeComponent';
import { BubbleChartComponent } from './BubbleChartComponent';
import { CHART_REGISTRY } from './registry';
import { BarChart2, LineChart, PieChart, ScatterChart as ScatterIcon, Activity, Layers, Settings2, Grid, Filter, Gauge as GaugeIcon, Sparkles } from 'lucide-react';

export interface VisualStrategySpec {
  id: string;
  title: string;
  description: string;
  chart_type: string;
  category?: string;
  config: Record<string, any>;
  data: any[];
}

interface ChartEngineProps {
  strategy: VisualStrategySpec;
  onConfigChange?: (updatedStrategy: VisualStrategySpec) => void;
  onAttachToChat?: (strategy: VisualStrategySpec) => void;
}

const SUPPORTED_CHARTS = ['bar', 'line', 'area', 'pie', 'donut', 'scatter', 'radar', 'composed', 'treemap', 'funnel', 'gauge', 'bubble', 'kpi'];

export const ChartEngine: React.FC<ChartEngineProps> = ({ strategy, onConfigChange, onAttachToChat }) => {
  const initialType = (strategy.chart_type || 'bar').toLowerCase();
  const [currentChartType, setCurrentChartType] = useState<string>(
    SUPPORTED_CHARTS.includes(initialType) ? initialType : 'bar'
  );
  const [showConfig, setShowConfig] = useState(false);
  const [isStacked, setIsStacked] = useState<boolean>(strategy.config?.stacked ?? false);

  const { title, description, config = {}, data = [] } = strategy;

  // Dynamically normalize data: format booleans and inspect keys
  const normalizedData = React.useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    return data.map((row) => {
      if (!row || typeof row !== 'object') return row;
      const cleanRow: Record<string, any> = {};
      for (const [k, v] of Object.entries(row)) {
        if (typeof v === 'boolean') {
          cleanRow[k] = v ? 'Yes' : 'No';
        } else {
          cleanRow[k] = v;
        }
      }
      return cleanRow;
    });
  }, [data]);

  // Safeguard: dynamically bind actual data keys so no chart renders blank
  const dataKeys = normalizedData.length > 0 ? Object.keys(normalizedData[0]) : [];
  const actualXKey = config.xAxisKey && dataKeys.includes(config.xAxisKey)
    ? config.xAxisKey
    : (dataKeys[0] || 'x');

  const declaredY = Array.isArray(config.yAxisKeys)
    ? config.yAxisKeys
    : (config.yAxisKeys ? [config.yAxisKeys] : []);
  const validDeclaredY = declaredY.filter((k: string) => dataKeys.includes(k) && k !== actualXKey);
  const fallbackY = dataKeys.filter((k: string) => k !== actualXKey);
  const actualYKeys = validDeclaredY.length > 0
    ? validDeclaredY
    : (fallbackY.length > 0 ? fallbackY : [dataKeys[1] || 'value']);

  const activeConfig = {
    ...config,
    xAxisKey: actualXKey,
    yAxisKeys: actualYKeys,
    stacked: isStacked,
  };

  const renderChartBody = () => {
    const cfg = activeConfig as any;
    switch (currentChartType.toLowerCase()) {
      case 'bar':
        return <BarChartComponent data={normalizedData} config={cfg} />;
      case 'line':
        return <LineChartComponent data={normalizedData} config={cfg} />;
      case 'area':
        return <AreaChartComponent data={normalizedData} config={cfg} />;
      case 'pie':
        return <PieDonutChartComponent data={normalizedData} config={cfg} isDonut={false} />;
      case 'donut':
        return <PieDonutChartComponent data={normalizedData} config={cfg} isDonut={true} />;
      case 'scatter':
        return <ScatterPlotComponent data={normalizedData} config={cfg} />;
      case 'radar':
        return <RadarChartComponent data={normalizedData} config={cfg} />;
      case 'composed':
        return <ComposedChartComponent data={normalizedData} config={cfg} />;
      case 'treemap':
        return <TreemapComponent data={normalizedData} config={cfg} />;
      case 'funnel':
        return <FunnelComponent data={normalizedData} config={cfg} />;
      case 'gauge':
        return <GaugeComponent data={normalizedData} config={cfg} />;
      case 'bubble':
        return <BubbleChartComponent data={normalizedData} config={cfg} />;
      case 'kpi':
        return <KpiCardComponent title={title} description={description} config={cfg} />;
      default:
        return <BarChartComponent data={normalizedData} config={cfg} />;
    }
  };

  const getCategoryIcon = () => {
    switch (currentChartType.toLowerCase()) {
      case 'bar':
        return <BarChart2 className="w-4 h-4 text-blue-400" />;
      case 'line':
        return <LineChart className="w-4 h-4 text-emerald-400" />;
      case 'pie':
      case 'donut':
        return <PieChart className="w-4 h-4 text-purple-400" />;
      case 'scatter':
      case 'bubble':
        return <ScatterIcon className="w-4 h-4 text-pink-400" />;
      case 'treemap':
        return <Grid className="w-4 h-4 text-amber-400" />;
      case 'funnel':
        return <Filter className="w-4 h-4 text-cyan-400" />;
      case 'gauge':
        return <GaugeIcon className="w-4 h-4 text-rose-400" />;
      case 'kpi':
        return <Activity className="w-4 h-4 text-amber-400" />;
      default:
        return <Layers className="w-4 h-4 text-indigo-400" />;
    }
  };

  if (currentChartType.toLowerCase() === 'kpi') {
    return renderChartBody();
  }

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl hover:border-slate-700 transition-all relative group min-w-0 overflow-hidden">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {getCategoryIcon()}
            <h3 className="text-sm font-semibold text-slate-100 truncate">{title}</h3>
          </div>
          {description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{description}</p>
          )}
        </div>

        {/* Dynamic Controls Header */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {onAttachToChat && (
            <button
              onClick={() =>
                onAttachToChat({
                  ...strategy,
                  chart_type: currentChartType,
                  config: activeConfig,
                  data: normalizedData,
                })
              }
              title="Attach this chart and ask AI questions about it"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-medium transition-all shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          )}

          <select
            value={currentChartType}
            onChange={(e) => setCurrentChartType(e.target.value)}
            className="text-[11px] bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {Object.entries(CHART_REGISTRY).map(([typeKey, reg]) => (
              <option key={typeKey} value={typeKey}>
                {reg.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowConfig(!showConfig)}
            title="Toggle Chart Settings"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Config Bar */}
      {showConfig && (
        <div className="mb-3 p-2 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-3">
            {(currentChartType === 'bar' || currentChartType === 'area') && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isStacked}
                  onChange={(e) => setIsStacked(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                />
                <span>Stacked View</span>
              </label>
            )}
            <span className="text-[10px] text-slate-500 font-mono">X-Axis: {config.xAxisKey || 'Auto'}</span>
            <span className="text-[10px] text-slate-500 font-mono">Y-Metrics: {config.yAxisKeys?.join(', ') || 'Auto'}</span>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="flex-1 w-full min-h-[280px] flex items-center justify-center">
        {data && data.length > 0 ? (
          renderChartBody()
        ) : (
          <div className="text-xs text-slate-500 italic">No renderable dataset points</div>
        )}
      </div>
    </div>
  );
};
