'use client';

import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';

interface KpiCardProps {
  title: string;
  description?: string;
  config: {
    primaryValue?: string | number;
    subText?: string;
    colorPalette?: string[];
  };
}

export const KpiCardComponent: React.FC<KpiCardProps> = ({ title, description, config }) => {
  const value = config.primaryValue ?? 'N/A';
  const subText = config.subText ?? '';
  const accentColor = (config.colorPalette && config.colorPalette[0]) || '#3b82f6';

  return (
    <div className="flex flex-col justify-between p-6 bg-slate-900/90 border border-slate-800 rounded-xl h-full shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-all">
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Activity className="w-4 h-4" />
        </div>
      </div>

      <div className="my-4">
        <div className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight" style={{ color: accentColor }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {subText && (
          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{subText}</span>
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-slate-400 line-clamp-2 border-t border-slate-800/80 pt-3 mt-1">
          {description}
        </p>
      )}
    </div>
  );
};
