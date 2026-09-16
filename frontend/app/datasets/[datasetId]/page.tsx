'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { DataGrid } from '@/components/data-grid/DataGrid';
import { ChartEngine, VisualStrategySpec } from '@/components/charts/ChartEngine';
import { ChartCandidatePickerModal, ChartCandidate } from '@/components/shared/ChartCandidatePickerModal';
import { ExecutionLogViewer } from '@/components/shared/ExecutionLogViewer';
import { DatasetChatSidebar } from '@/components/shared/DatasetChatSidebar';
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
  Loader2,
  Terminal,
  Filter
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
  const [isGeneratingSelected, setIsGeneratingSelected] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Chat Sidebar & Modal & Logging state
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [candidates, setCandidates] = useState<ChartCandidate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const addLog = (logMsg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${logMsg}`]);
  };

  const fetchDatasetDetails = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      addLog(`Fetching dataset details for ID: ${datasetId}`);
      const data = await datasetApi.getDatasetDetails(datasetId);
      setDataset(data);
      addLog(`Dataset '${data.name}' loaded successfully (${data.total_rows} rows).`);

      if (data.ai_analysis && data.ai_analysis.strategies) {
        setActiveTab('visualizations');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to load dataset details.';
      setErrorMsg(msg);
      addLog(`ERROR: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (datasetId) {
      fetchDatasetDetails();
    }
  }, [datasetId]);

  const handleOpenCandidatePicker = async () => {
    setIsAiAnalyzing(true);
    setErrorMsg(null);
    addLog('Initiating AI Candidate Discovery step...');
    try {
      const res = await datasetApi.fetchCandidates(datasetId);
      if (res.logs) {
        res.logs.forEach((l: string) => addLog(l));
      }
      setCandidates(res.candidates || []);
      addLog(`Received ${res.candidates?.length || 0} doable chart candidates from AI backend engine.`);
      setIsModalOpen(true);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'AI candidate discovery failed.';
      setErrorMsg(msg);
      addLog(`ERROR: ${msg}`);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleConfirmCandidateSelection = async (selectedIds: string[], customCharts: any[]) => {
    setIsGeneratingSelected(true);
    addLog(`User confirmed selection of ${selectedIds.length} candidate charts and ${customCharts.length} custom combo charts.`);
    try {
      const res = await datasetApi.generateSelectedCharts(datasetId, selectedIds, customCharts);
      if (res.logs) {
        res.logs.forEach((l: string) => addLog(l));
      }
      if (res.analysis) {
        setDataset((prev: any) => ({
          ...prev,
          ai_analysis: res.analysis,
        }));
      }
      setIsModalOpen(false);
      setActiveTab('visualizations');
      addLog('All selected charts successfully computed via DuckDB engine.');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to generate selected charts.';
      setErrorMsg(msg);
      addLog(`ERROR: ${msg}`);
    } finally {
      setIsGeneratingSelected(false);
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
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-7rem)] flex flex-col space-y-4 relative px-4 overflow-hidden pb-4">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 shrink-0">
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                isChatOpen
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isChatOpen ? 'Hide Chat Assistant' : 'Chat with Data'}</span>
            </button>

            <button
              onClick={() => setIsLogOpen(!isLogOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                isLogOpen
                  ? 'bg-slate-800 text-indigo-400 border-indigo-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Logs ({logs.length})</span>
            </button>

            <button
              onClick={handleOpenCandidatePicker}
              disabled={isAiAnalyzing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {isAiAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 text-cyan-200 animate-spin" />
                  <span>Discovering AI Charts...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>AI Chart Recommendations</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Content Layout with In-Page Resizable Chat Sidebar */}
        <div className="flex-1 min-h-0 flex items-stretch gap-6">
          {/* Main Workspace (Data Grid / Visualizations) */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0 space-y-4 overflow-y-auto pr-1">
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
                Visualizations ({strategies.length})
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'preview' ? (
              <div className="flex-1 min-h-0 h-full">
                <DataGrid
                  columns={columns}
                  rows={rows}
                  totalRows={dataset.total_rows}
                  isAiAnalyzing={isAiAnalyzing}
                  onRunAiAnalysis={handleOpenCandidatePicker}
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

                  <button
                    onClick={handleOpenCandidatePicker}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition-colors"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Customize / Add More Charts</span>
                  </button>
                </div>

                {strategies.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {strategies.map((strat) => (
                      <ChartEngine key={strat.id} strategy={strat} />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
                    <p className="text-xs">No visual strategies created yet. Pick from AI candidates or build custom charts.</p>
                    <button
                      onClick={handleOpenCandidatePicker}
                      className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                      Open AI Chart Picker & Builder
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* In-Page Resizable Chat Assistant Panel */}
          <DatasetChatSidebar
            datasetId={datasetId}
            datasetName={dataset.name}
            isOpen={isChatOpen}
            onToggle={() => setIsChatOpen(false)}
          />
        </div>

        {/* AI Chart Candidate Picker Modal */}
        <ChartCandidatePickerModal
          candidates={candidates}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirmSelection={handleConfirmCandidateSelection}
          isLoading={isGeneratingSelected}
        />

        {/* Real-time Logs Console */}
        <ExecutionLogViewer
          logs={logs}
          isOpen={isLogOpen}
          onClose={() => setIsLogOpen(false)}
          onClearLogs={() => setLogs([])}
        />
      </div>
    </AppShell>
  );
}
