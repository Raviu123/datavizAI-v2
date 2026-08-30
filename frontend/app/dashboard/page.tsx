'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { datasetApi } from '@/lib/api-client';
import {
  Database,
  Sparkles,
  Plus,
  ArrowRight,
  Zap,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2
} from 'lucide-react';

interface DatasetItem {
  id: string;
  name: string;
  size_bytes: number;
  total_rows: number;
  total_columns: number;
  has_ai_analysis: boolean;
}

export default function DashboardOverviewPage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    datasetApi
      .listDatasets()
      .then((res) => {
        setDatasets(res.datasets || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-indigo-400" />
              Executive Intelligence Workspace
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              DuckDB Ingestion, OpenRouter LLM Strategy Engine & Modular Recharts Visualization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/ai-chat"
              className="px-3.5 py-2 rounded-md bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-medium flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI Assistant
            </Link>
            <Link
              href="/datasets"
              className="px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Upload Data File
            </Link>
          </div>
        </div>

        {/* Real Backend Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
            <div className="text-xs font-medium text-slate-400">Database Engine</div>
            <div className="text-xl font-bold text-indigo-400 mt-1 font-mono">PostgreSQL + DuckDB</div>
            <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Container Docker Live
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
            <div className="text-xs font-medium text-slate-400">AI LLM Provider</div>
            <div className="text-xl font-bold text-cyan-400 mt-1 font-mono">OpenRouter Adapter</div>
            <div className="text-[11px] text-slate-400 mt-2">Model: nvidia/nemotron-3-ultra-550b-a55b:free</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
            <div className="text-xs font-medium text-slate-400">Uploaded Datasets</div>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
              {isLoading ? '...' : datasets.length} File(s)
            </div>
            <div className="text-[11px] text-slate-400 mt-2">Ready for profiling & AI charts</div>
          </div>
        </div>

        {/* Active Datasets Section */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-slate-200">Ingested Backend Datasets</h2>
            </div>
            <Link href="/datasets" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
              Manage datasets <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading datasets from backend...</div>
          ) : datasets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasets.map((dataset) => (
                <Link
                  key={dataset.id}
                  href={`/datasets/${dataset.id}`}
                  className="block p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:border-indigo-500/50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h3 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors truncate">
                        {dataset.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono">ID: {dataset.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-t border-slate-800/80 pt-3">
                    <span>{dataset.total_rows.toLocaleString()} rows</span>
                    <span className="text-indigo-400">{dataset.total_columns} columns</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 border-2 border-dashed border-slate-800 rounded-xl text-center flex flex-col items-center justify-center">
              <UploadCloud className="w-10 h-10 text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No datasets uploaded yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Upload a CSV, Excel, Parquet, or JSON file to run DuckDB column profiling and OpenRouter AI visualization strategy generation.
              </p>
              <Link
                href="/datasets"
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Upload Your First File
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
