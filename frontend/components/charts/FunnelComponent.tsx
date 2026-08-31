'use client';

import React from 'react';
import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip } from 'recharts';

interface FunnelComponentProps {
  data: any[];
  config: {
    xAxisKey?: string;
    yAxisKeys?: string[];
    colorPalette?: string[];
  };
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899'];

export const FunnelComponent: React.FC<FunnelComponentProps> = ({ data, config }) => {
  const xAxisKey = config.xAxisKey || (data.length > 0 ? Object.keys(data[0])[0] : 'stage');
  const yAxisKeys = config.yAxisKeys || (data.length > 0 ? Object.keys(data[0]).filter(k => k !== xAxisKey) : ['value']);
  const valueKey = yAxisKeys[0];
  const colors = config.colorPalette || DEFAULT_COLORS;

  const formattedData = data.map((item, idx) => ({
    name: String(item[xAxisKey] ?? `Stage ${idx + 1}`),
    value: Number(item[valueKey]) || 0,
    fill: colors[idx % colors.length],
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
          <Funnel dataKey="value" data={formattedData} isAnimationActive>
            <LabelList position="right" fill="#cbd5e1" stroke="none" dataKey="name" fontSize={11} />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
};
