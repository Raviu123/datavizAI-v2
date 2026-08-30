'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { DataGrid } from '@/components/data-grid/DataGrid';
import { ChartEngine, VisualStrategySpec } from '@/components/charts/ChartEngine';
import { datasetApi } from '@/lib/api-client';
import {
  FileSpreadsheet,
  Table as TableIcon,
  BarChart2,
  Sparkles,
  ArrowLeft,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface DatasetDetailPageProps {
  params: Promise<{ datasetId: string }>;
}

export default function DatasetDetailPage({ params }: DatasetDetailPageProps) {
  const resolvedParams = use(params);
  const datasetId = resolvedParams.datasetId;

  const [dataset, setDataset] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'visualizations'>('preview');
  const [isLoading, setIsLoading] = useState(true);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDatasetDetails = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await datasetApi.getDatasetDetails(datasetId);
      setDataset(data);
      if (data.ai_analysis && data.ai_analysis.strategies) {
        // If analysis already exists, show visualizations right away
        setActiveTab('visualizations');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to load dataset details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (datasetId) {
      fetchDatasetDetails();
    }
  }, [datasetId]);

  const handleRunAiAnalysis = async () => {
    setIsAiAnalyzing(true);
    setErrorMsg(null);
    try {
      const res = await datasetApi.analyzeDataset(datasetId);
      if (res.analysis) {
        setDataset((prev: any) => ({
          ...prev,
          ai_analysis: res.analysis,
        }));
      }
      // Auto navigate to visualizations tab on completion
      setActiveTab('visualizations');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'AI analysis request failed.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-xs">Loading dataset & DuckDB metadata...</p>
        </div>
      </AppShell>
    );
  }

  if (errorMsg || !dataset) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto p-8 space-y-4">
          <Link href="/datasets" className="text-xs text-indigo-400 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to datasets
          </Link>
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg || 'Dataset not found.'}</span>
          </div>
        </div>
      </AppShell>
    );
  }

  const columns = dataset.profile?.columns || [];
  const rows = dataset.rows || [];
  const strategies: VisualStrategySpec[] = dataset.ai_analysis?.strategies || [];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/datasets"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                <h1 className="text-xl font-bold text-slate-100">{dataset.name}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  DuckDB Ingested
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {dataset.total_rows?.toLocaleString()} rows &bull; {dataset.total_columns} columns &bull; Real DuckDB & OpenRouter Engine
              </p>
            </div>
          </div>

          <button
            onClick={handleRunAiAnalysis}
            disabled={isAiAnalyzing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {isAiAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 text-cyan-200 animate-spin" />
                <span>AI Analyzing & Computing Charts...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Generate AI Visualizations</span>
              </>
            )}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            Data Grid View
          </button>
          <button
            onClick={() => setActiveTab('visualizations')}
            className={`pb-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'visualizations'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            AI Generated Visualizations ({strategies.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'preview' ? (
          <div className="h-[600px]">
            <DataGrid
              columns={columns}
              rows={rows}
              totalRows={dataset.total_rows}
              isAiAnalyzing={isAiAnalyzing}
              onRunAiAnalysis={handleRunAiAnalysis}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-indigo-200 uppercase tracking-wide">
                    OpenRouter AI & DuckDB Engine: {dataset.ai_analysis?.domain_context || 'NVIDIA Nemotron 3 Ultra 550B'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {dataset.ai_analysis?.dataset_summary || 'Visual analytics generated dynamically based on frontend chart registry capabilities.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Lazy Skeleton Loading Grid when isAiAnalyzing */}
            {isAiAnalyzing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 animate-pulse">
                    <div className="h-4 bg-slate-800 rounded w-1/3" />
                    <div className="h-3 bg-slate-800/60 rounded w-2/3" />
                    <div className="h-60 bg-slate-950/80 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                  </div>
                ))}
              </div>
            ) : strategies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {strategies.map((strat) => (
                  <ChartEngine key={strat.id} strategy={strat} />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 bg-slate-900/50 border border-slate-800 rounded-xl">
                <p className="text-xs mb-3">No visual strategies generated yet.</p>
                <button
                  onClick={handleRunAiAnalysis}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-500 transition-colors"
                >
                  Generate Visualizations with OpenRouter & DuckDB
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
