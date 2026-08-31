'use client';

import React from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';

interface TreemapComponentProps {
  data: any[];
  config: {
    xAxisKey?: string;
    yAxisKeys?: string[];
    colorPalette?: string[];
  };
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

const CustomContent = (props: any) => {
  const { x, y, width, height, name, value, index, colors } = props;
  if (width < 30 || height < 20) return null;
  const color = colors ? colors[index % colors.length] : DEFAULT_COLORS[index % DEFAULT_COLORS.length];

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color,
          stroke: '#0f172a',
          strokeWidth: 2,
          strokeOpacity: 0.8,
          rx: 4,
          ry: 4,
        }}
      />
      {width > 45 && height > 25 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={11}
          fontWeight={600}
          dy={4}
        >
          {name}: {typeof value === 'number' ? value.toLocaleString() : value}
        </text>
      )}
    </g>
  );
};

export const TreemapComponent: React.FC<TreemapComponentProps> = ({ data, config }) => {
  const xAxisKey = config.xAxisKey || (data.length > 0 ? Object.keys(data[0])[0] : 'name');
  const yAxisKeys = config.yAxisKeys || (data.length > 0 ? Object.keys(data[0]).filter(k => k !== xAxisKey) : ['value']);
  const valueKey = yAxisKeys[0];
  const colors = config.colorPalette || DEFAULT_COLORS;

  const formattedData = data.map((item) => ({
    name: String(item[xAxisKey] ?? 'Unknown'),
    value: Number(item[valueKey]) || 1,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={formattedData}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="#0f172a"
          content={<CustomContent colors={colors} />}
        >
          <Tooltip
            content={({ payload }) => {
              if (payload && payload.length) {
                const dataItem = payload[0].payload;
                return (
                  <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow text-xs text-slate-100">
                    <span className="font-bold">{dataItem.name}</span>: {dataItem.value?.toLocaleString()}
                  </div>
                );
              }
              return null;
            }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
};
