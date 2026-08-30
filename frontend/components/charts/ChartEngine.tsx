'use client';

import React from 'react';
import { BarChartComponent } from './BarChartComponent';
import { LineChartComponent } from './LineChartComponent';
import { AreaChartComponent } from './AreaChartComponent';
import { PieDonutChartComponent } from './PieDonutChartComponent';
import { ScatterPlotComponent } from './ScatterPlotComponent';
import { RadarChartComponent } from './RadarChartComponent';
import { ComposedChartComponent } from './ComposedChartComponent';
import { KpiCardComponent } from './KpiCardComponent';
import { BarChart2, LineChart, PieChart, ScatterChart as ScatterIcon, Activity, Layers } from 'lucide-react';

export interface VisualStrategySpec {
  id: string;
  title: string;
  description: string;
  chart_type: 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'radar' | 'composed' | 'kpi' | string;
  category?: string;
  config: Record<string, any>;
  data: any[];
}

interface ChartEngineProps {
  strategy: VisualStrategySpec;
}

export const ChartEngine: React.FC<ChartEngineProps> = ({ strategy }) => {
  const { title, description, chart_type, config, data } = strategy;

  const renderChartBody = () => {
    switch (chart_type.toLowerCase()) {
      case 'bar':
        return <BarChartComponent data={data} config={config} />;
      case 'line':
        return <LineChartComponent data={data} config={config} />;
      case 'area':
        return <AreaChartComponent data={data} config={config} />;
      case 'pie':
        return <PieDonutChartComponent data={data} config={config} isDonut={false} />;
      case 'donut':
        return <PieDonutChartComponent data={data} config={config} isDonut={true} />;
      case 'scatter':
        return <ScatterPlotComponent data={data} config={config} />;
      case 'radar':
        return <RadarChartComponent data={data} config={config} />;
      case 'composed':
        return <ComposedChartComponent data={data} config={config} />;
      case 'kpi':
        return <KpiCardComponent title={title} description={description} config={config} />;
      default:
        return <BarChartComponent data={data} config={config} />;
    }
  };

  const getCategoryIcon = () => {
    switch (chart_type.toLowerCase()) {
      case 'bar':
        return <BarChart2 className="w-4 h-4 text-blue-400" />;
      case 'line':
        return <LineChart className="w-4 h-4 text-emerald-400" />;
      case 'pie':
      case 'donut':
        return <PieChart className="w-4 h-4 text-purple-400" />;
      case 'scatter':
        return <ScatterIcon className="w-4 h-4 text-pink-400" />;
      case 'kpi':
        return <Activity className="w-4 h-4 text-amber-400" />;
      default:
        return <Layers className="w-4 h-4 text-indigo-400" />;
    }
  };

  if (chart_type.toLowerCase() === 'kpi') {
    return renderChartBody();
  }

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-slate-700 transition-colors">
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
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">
          {chart_type}
        </span>
      </div>

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
