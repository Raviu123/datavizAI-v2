'use client';

import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid } from 'recharts';

interface BubbleChartProps {
  data: any[];
  config: {
    xAxisKey?: string;
    yAxisKeys?: string[];
    zAxisKey?: string;
    colorPalette?: string[];
  };
}

export const BubbleChartComponent: React.FC<BubbleChartProps> = ({ data, config }) => {
  const xAxisKey = config.xAxisKey || (data.length > 0 ? Object.keys(data[0])[0] : 'x');
  const yAxisKeys = config.yAxisKeys || (data.length > 0 ? Object.keys(data[0]).filter(k => k !== xAxisKey) : ['y']);
  const yAxisKey = yAxisKeys[0];
  const zAxisKey = config.zAxisKey || yAxisKeys[1] || yAxisKey;
  const color = config.colorPalette?.[0] || '#ec4899';

  const formattedData = data.map((item) => ({
    x: Number(item[xAxisKey]) || 0,
    y: Number(item[yAxisKey]) || 0,
    z: Number(item[zAxisKey]) || 10,
    label: item[xAxisKey],
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="x" name={xAxisKey} stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis dataKey="y" name={yAxisKey} stroke="#94a3b8" fontSize={11} tickLine={false} />
          <ZAxis dataKey="z" range={[60, 400]} name={zAxisKey} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
          />
          <Scatter name="Bubble Matrix" data={formattedData} fill={color} opacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
