'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface PieDonutChartProps {
  data: any[];
  config: {
    xAxisKey?: string;
    yAxisKeys?: string[];
    colorPalette?: string[];
  };
  isDonut?: boolean;
}

export const PieDonutChartComponent: React.FC<PieDonutChartProps> = ({ data, config, isDonut = false }) => {
  const nameKey = config.xAxisKey || (data.length > 0 ? Object.keys(data[0])[0] : 'name');
  const valueKey = (config.yAxisKeys && config.yAxisKeys[0]) || (data.length > 0 ? Object.keys(data[0])[1] : 'value');
  const colors = config.colorPalette || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
            formatter={(val: any) => [typeof val === 'number' ? val.toLocaleString() : val, 'Value']}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={isDonut ? 55 : 0}
            outerRadius={85}
            paddingAngle={isDonut ? 3 : 1}
            label={({ name, percent }) => {
              if (!percent || percent < 0.05) return '';
              const shortName = String(name).length > 14 ? `${String(name).substring(0, 12)}…` : name;
              return `${shortName} (${(percent * 100).toFixed(0)}%)`;
            }}
            labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
          >
            {data.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} stroke="#0f172a" strokeWidth={2} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
