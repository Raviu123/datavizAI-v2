'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface BarChartProps {
  data: any[];
  config: {
    xAxisKey?: string;
    yAxisKeys?: string[];
    colorPalette?: string[];
    stacked?: boolean;
  };
}

export const BarChartComponent: React.FC<BarChartProps> = ({ data, config }) => {
  const xAxisKey = config.xAxisKey || (data.length > 0 ? Object.keys(data[0])[0] : 'x');
  const yAxisKeys = config.yAxisKeys || (data.length > 0 ? Object.keys(data[0]).filter(k => k !== xAxisKey) : ['y']);
  const colors = config.colorPalette || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const formatNumber = (num: any) => {
    if (typeof num !== 'number') return num;
    const abs = Math.abs(num);
    if (abs >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.6} />
          <XAxis
            dataKey={xAxisKey}
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            tickFormatter={(v) => (String(v).length > 15 ? `${String(v).substring(0, 13)}…` : String(v))}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            tickFormatter={formatNumber}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
            formatter={(val: any) => [typeof val === 'number' ? val.toLocaleString() : val, 'Value']}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          {yAxisKeys.map((key, idx) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[idx % colors.length]}
              stackId={config.stacked ? 'a' : undefined}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
