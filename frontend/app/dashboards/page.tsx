'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import {
  BarChart3,
  Plus,
  ArrowUpRight,
  Search,
  LayoutGrid,
  Sparkles,
  Clock
} from 'lucide-react';

export default function DashboardsPage() {
  const [search, setSearch] = useState('');
  const dashboards: any[] = [];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              Dashboards & Canvas
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Interactive multi-widget dashboards powered by natural language queries and DuckDB.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/data-sources"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-md text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Build Real-Time Live Dashboard</span>
            </Link>
            <Link
              href="/datasets"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-medium flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Dataset</span>
            </Link>
          </div>
        </div>

        {/* Dashboards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between group transition-all"
            >
              <div>
                <h3 className="text-base font-semibold text-slate-100">{dashboard.title}</h3>
                <p className="text-xs text-slate-400 mt-2">{dashboard.description}</p>
              </div>
            </div>
          ))}

          {/* Create Blank Dashboard Card */}
          <Link
            href="/datasets"
            className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/20 hover:bg-slate-900/40 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all group min-h-[220px]"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-400 flex items-center justify-center mb-3 transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No Custom Dashboards Saved Yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Upload a dataset and run OpenRouter AI analysis to generate active visualization charts!
            </p>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
