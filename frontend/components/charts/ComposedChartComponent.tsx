'use client';

import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface ComposedChartProps {
  data: any[];
  config: {
    xAxisKey?: string;
    yAxisKeys?: string[];
    colorPalette?: string[];
  };
}

export const ComposedChartComponent: React.FC<ComposedChartProps> = ({ data, config }) => {
  const xAxisKey = config.xAxisKey || (data.length > 0 ? Object.keys(data[0])[0] : 'x');
  const yAxisKeys = config.yAxisKeys || (data.length > 0 ? Object.keys(data[0]).filter(k => k !== xAxisKey) : ['y']);
  const colors = config.colorPalette || ['#3b82f6', '#10b981', '#f59e0b'];

  const barKey = yAxisKeys[0];
  const lineKey = yAxisKeys[1] || yAxisKeys[0];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          {barKey && <Bar dataKey={barKey} fill={colors[0]} radius={[4, 4, 0, 0]} />}
          {lineKey && <Line type="monotone" dataKey={lineKey} stroke={colors[1] || '#10b981'} strokeWidth={3} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
