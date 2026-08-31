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
import { BarChart2, LineChart, PieChart, ScatterChart as ScatterIcon, Activity, Layers, Settings2, Grid, Filter, Gauge as GaugeIcon } from 'lucide-react';

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
}

export const ChartEngine: React.FC<ChartEngineProps> = ({ strategy, onConfigChange }) => {
  const [currentChartType, setCurrentChartType] = useState<string>(strategy.chart_type || 'bar');
  const [showConfig, setShowConfig] = useState(false);
  const [isStacked, setIsStacked] = useState<boolean>(strategy.config?.stacked ?? false);

  const { title, description, config, data } = strategy;

  const activeConfig = {
    ...config,
    stacked: isStacked,
  };

  const renderChartBody = () => {
    const cfg = activeConfig as any;
    switch (currentChartType.toLowerCase()) {
      case 'bar':
        return <BarChartComponent data={data} config={cfg} />;
      case 'line':
        return <LineChartComponent data={data} config={cfg} />;
      case 'area':
        return <AreaChartComponent data={data} config={cfg} />;
      case 'pie':
        return <PieDonutChartComponent data={data} config={cfg} isDonut={false} />;
      case 'donut':
        return <PieDonutChartComponent data={data} config={cfg} isDonut={true} />;
      case 'scatter':
        return <ScatterPlotComponent data={data} config={cfg} />;
      case 'radar':
        return <RadarChartComponent data={data} config={cfg} />;
      case 'composed':
        return <ComposedChartComponent data={data} config={cfg} />;
      case 'treemap':
        return <TreemapComponent data={data} config={cfg} />;
      case 'funnel':
        return <FunnelComponent data={data} config={cfg} />;
      case 'gauge':
        return <GaugeComponent data={data} config={cfg} />;
      case 'bubble':
        return <BubbleChartComponent data={data} config={cfg} />;
      case 'kpi':
        return <KpiCardComponent title={title} description={description} config={cfg} />;
      default:
        return <BarChartComponent data={data} config={cfg} />;
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
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-slate-700 transition-all relative group">
      {/* Chart Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            {getCategoryIcon()}
            <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          </div>
          {description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{description}</p>
          )}
        </div>

        {/* Dynamic Controls Header */}
        <div className="flex items-center gap-2">
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
