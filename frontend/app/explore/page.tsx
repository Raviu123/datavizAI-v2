'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { datasetApi } from '@/lib/api-client';
import {
  Sparkles,
  Compass,
  Play,
  Code2,
  Table as TableIcon,
  BarChart2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function ExploreQueryPage() {
  const [nlQuery, setNlQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [generatedSql, setGeneratedSql] = useState<string>('-- Enter a prompt to generate DuckDB SQL dynamically');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('chart');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRun = async () => {
    if (!nlQuery.trim()) return;

    setIsExecuting(true);
    setErrorMsg(null);
    try {
      // Simulate/trigger SQL generation & query execution
      setGeneratedSql(`SELECT column_name, COUNT(*) as frequency FROM dataset_table GROUP BY column_name ORDER BY frequency DESC LIMIT 10;`);
      setQueryResult([]);
    } catch (err: any) {
      setErrorMsg('Failed to execute query.');
    } finally {
      setIsExecuting(false);
    }
  };

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
            Ask questions in plain English or generate vectorized DuckDB SQL queries against uploaded datasets.
          </p>
        </div>

        {/* AI Input Prompt Box */}
        <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-4 space-y-3 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            OpenRouter AI Query Generator
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="e.g. Compare distribution of records by category..."
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
            <button
              onClick={handleRun}
              disabled={isExecuting || !nlQuery.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-all shrink-0 shadow-md shadow-indigo-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isExecuting ? 'Generating SQL...' : 'Run Query'}
            </button>
          </div>
        </div>

        {/* Results Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generated SQL Code Box */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  DuckDB Vectorized SQL
                </div>
              </div>
              <pre className="bg-slate-950 p-3 rounded-lg text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto border border-slate-800/80">
                {generatedSql}
              </pre>
            </div>
          </div>

          {/* Visualization / Output */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 min-h-[300px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('chart')}
                  className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    viewMode === 'chart'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" /> Chart View
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    viewMode === 'table'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" /> Table View
                </button>
              </div>
            </div>

            {queryResult.length > 0 ? (
              viewMode === 'chart' ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={queryResult}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {queryResult.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3">{row.category}</td>
                          <td className="py-2.5 px-3">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs italic">
                Enter a natural language query above to execute against DuckDB and view results.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
