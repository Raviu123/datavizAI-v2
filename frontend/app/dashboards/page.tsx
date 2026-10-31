'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { datasetApi } from '@/lib/api-client';
import {
  BarChart3,
  Plus,
  ArrowUpRight,
  Search,
  Sparkles,
  Database,
  Calendar,
  Layers,
  Loader2,
} from 'lucide-react';

export default function DashboardsPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboards() {
      try {
        const res = await datasetApi.listDatasets();
        setDatasets(res.datasets || []);
      } catch (err) {
        console.error('Error fetching dashboard datasets:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboards();
  }, []);

  const filtered = datasets.filter((d) =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              Dashboards & Visual Intelligence Canvas
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Multi-widget analytics dashboards powered by DuckDB SQL and OpenRouter AI.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/data-sources"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-md text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Real-Time Live Dashboard</span>
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

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search dashboards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Dashboards Grid */}
        {isLoading ? (
          <div className="p-16 flex items-center justify-center text-slate-400 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Loading dashboards...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((d) => (
              <div
                key={d.id}
                className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl p-5 flex flex-col justify-between group transition-all shadow-lg hover:shadow-indigo-500/5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {d.has_ai_analysis ? 'AI Strategy Generated' : 'Ready for Analysis'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {d.total_rows?.toLocaleString() || 0} rows
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {d.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {d.has_ai_analysis
                      ? 'Interactive dashboard with multi-metric DuckDB SQL chart widgets.'
                      : 'Dataset ingested and profiled. Open canvas to discover AI visualizations.'}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {d.total_columns || 0} dimensions
                  </span>
                  <Link
                    href={`/datasets/${d.id}`}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Open Canvas</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}

            {/* Create Blank Dashboard Card */}
            <Link
              href="/datasets"
              className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/20 hover:bg-slate-900/40 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all group min-h-[200px]"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-400 flex items-center justify-center mb-3 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Ingest New Data File</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Upload CSV, XLSX, Parquet, or JSON to generate an AI intelligence dashboard.
              </p>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
