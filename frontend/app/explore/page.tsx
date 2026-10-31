'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { datasetApi } from '@/lib/api-client';
import { ChartEngine } from '@/components/charts/ChartEngine';
import {
  Sparkles,
  Compass,
  Play,
  Code2,
  Table as TableIcon,
  BarChart2,
  AlertCircle,
  Database,
  Loader2,
} from 'lucide-react';

export default function ExploreQueryPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [nlQuery, setNlQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [generatedSql, setGeneratedSql] = useState<string>('-- Enter a prompt to generate DuckDB SQL dynamically');
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [visualization, setVisualization] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadDatasets() {
      try {
        const res = await datasetApi.listDatasets();
        const list = res.datasets || [];
        setDatasets(list);
        if (list.length > 0) {
          setSelectedDatasetId(list[0].id);
        }
      } catch (err) {
        console.error('Error fetching datasets:', err);
      }
    }
    loadDatasets();
  }, []);

  const handleRun = async () => {
    if (!nlQuery.trim() || !selectedDatasetId) return;

    setIsExecuting(true);
    setErrorMsg(null);
    try {
      const res = await datasetApi.chatWithData(selectedDatasetId, nlQuery);
      setGeneratedSql(res.sql || '-- Pure dataset metadata summary synthesized (No SQL execution required)');
      setAiExplanation(res.message || '');
      setQueryResult(res.chart_data || []);
      setVisualization(res.visualization || null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to execute query against DuckDB.');
    } finally {
      setIsExecuting(false);
    }
  };

  const tableColumns = queryResult.length > 0 ? Object.keys(queryResult[0]) : [];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800/60 pb-5">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-400" />
            Explore & Natural Language SQL Query
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ask analytical questions in natural language, automatically translated to vectorized DuckDB SQL with live visualizations.
          </p>
        </div>

        {/* Dataset Selection & AI Prompt Box */}
        <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-4 space-y-3 shadow-lg shadow-indigo-500/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              OpenRouter AI + DuckDB Query Engine
            </div>

            {/* Target Dataset Selector */}
            <div className="flex items-center gap-2 text-xs">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium">Target Dataset:</span>
              <select
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.total_rows?.toLocaleString() || 0} rows)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRun()}
              placeholder="e.g. Compare total revenue by region, show monthly sales trend, or list all categories..."
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
            <button
              onClick={handleRun}
              disabled={isExecuting || !nlQuery.trim() || !selectedDatasetId}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-all shrink-0 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isExecuting ? 'Executing...' : 'Run Query'}
            </button>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-500/30 p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Results Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generated SQL Code Box & Explanation */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  DuckDB Vectorized SQL
                </div>
              </div>
              <pre className="bg-slate-950 p-3 rounded-lg text-[11px] font-mono text-emerald-400 leading-relaxed overflow-x-auto border border-slate-800/80 whitespace-pre-wrap">
                {generatedSql}
              </pre>

              {aiExplanation && (
                <div className="mt-3 p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-300 space-y-1">
                  <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block">AI Analysis:</span>
                  <p className="leading-relaxed whitespace-pre-wrap">{aiExplanation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Visualization / Output */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 min-h-[360px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('chart')}
                  className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    viewMode === 'chart'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" /> Chart View
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" /> Table View ({queryResult.length})
                </button>
              </div>
            </div>

            {queryResult.length > 0 ? (
              viewMode === 'chart' && visualization ? (
                <div className="h-80 w-full">
                  <ChartEngine
                    strategy={{
                      id: 'explore_chart',
                      title: visualization.title || 'Dynamic Query Visualization',
                      description: `Rendered from ${queryResult.length} query records`,
                      chart_type: visualization.chart_type || 'bar',
                      config: visualization.config || {
                        xAxisKey: tableColumns[0] || 'category',
                        yAxisKeys: [tableColumns[1] || 'value'],
                        colorPalette: ['#6366f1', '#10b981', '#f59e0b'],
                      },
                      data: queryResult,
                    }}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] sticky top-0">
                        {tableColumns.map((col) => (
                          <th key={col} className="py-2.5 px-3 border-r border-slate-800/60">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {queryResult.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          {tableColumns.map((col) => (
                            <td key={col} className="py-2.5 px-3 border-r border-slate-800/40">
                              {row[col] !== null ? String(row[col]) : 'null'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="p-16 text-center text-slate-500 text-xs italic">
                {isExecuting ? 'Executing DuckDB SQL query...' : 'Select a dataset, type a question in natural language above, and click Run Query.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
