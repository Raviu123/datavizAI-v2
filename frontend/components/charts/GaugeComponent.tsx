'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface GaugeComponentProps {
  data: any[];
  config: {
    primaryValue?: number;
    targetValue?: number;
    subText?: string;
    colorPalette?: string[];
  };
}

export const GaugeComponent: React.FC<GaugeComponentProps> = ({ data, config }) => {
  let val = config.primaryValue;
  if (val === undefined && data && data.length > 0) {
    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    val = Number(firstRow[keys[1] || keys[0]]) || 0;
  }
  val = val ?? 75;
  const maxVal = config.targetValue || 100;
  const percentage = Math.min(100, Math.max(0, Math.round((val / maxVal) * 100)));

  const gaugeData = [
    { name: 'Progress', value: percentage, color: config.colorPalette?.[0] || '#3b82f6' },
    { name: 'Remaining', value: 100 - percentage, color: '#1e293b' },
  ];

  return (
    <div className="w-full h-72 flex flex-col items-center justify-center relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={gaugeData}
            cx="50%"
            cy="70%"
            startAngle={180}
            endAngle={0}
            innerRadius={65}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {gaugeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-[52%] text-center">
        <span className="text-3xl font-extrabold text-slate-100">{percentage}%</span>
        <p className="text-xs text-slate-400 mt-0.5">{val.toLocaleString()} / {maxVal.toLocaleString()}</p>
        {config.subText && <p className="text-[10px] text-indigo-400 mt-1">{config.subText}</p>}
      </div>
    </div>
  );
};
