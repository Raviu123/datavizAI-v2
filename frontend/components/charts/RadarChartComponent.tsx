'use client';

import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';

interface RadarChartProps {
  data: any[];
  config: {
    xAxisKey?: string;
    yAxisKeys?: string[];
    colorPalette?: string[];
  };
}

export const RadarChartComponent: React.FC<RadarChartProps> = ({ data, config }) => {
  const angleKey = config.xAxisKey || (data.length > 0 ? Object.keys(data[0])[0] : 'subject');
  const yAxisKeys = config.yAxisKeys || (data.length > 0 ? Object.keys(data[0]).filter(k => k !== angleKey) : ['value']);
  const colors = config.colorPalette || ['#8b5cf6', '#06b6d4', '#f59e0b'];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey={angleKey} stroke="#94a3b8" fontSize={11} />
          <PolarRadiusAxis stroke="#94a3b8" fontSize={10} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          {yAxisKeys.map((key, idx) => (
            <Radar
              key={key}
              name={key}
              dataKey={key}
              stroke={colors[idx % colors.length]}
              fill={colors[idx % colors.length]}
              fillOpacity={0.4}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
