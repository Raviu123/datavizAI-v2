'use client';

import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ScatterPlotProps {
  data: any[];
  config: {
    xAxisKey?: string;
    yAxisKeys?: string[];
    colorPalette?: string[];
  };
}

export const ScatterPlotComponent: React.FC<ScatterPlotProps> = ({ data, config }) => {
  const xAxisKey = config.xAxisKey || (data.length > 0 ? Object.keys(data[0])[0] : 'x');
  const yAxisKey = (config.yAxisKeys && config.yAxisKeys[0]) || (data.length > 0 ? Object.keys(data[0])[1] : 'y');
  const color = (config.colorPalette && config.colorPalette[0]) || '#ec4899';

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={11} name={xAxisKey} />
          <YAxis dataKey={yAxisKey} stroke="#94a3b8" fontSize={11} name={yAxisKey} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
          />
          <Scatter data={data} fill={color} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
