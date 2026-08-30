'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { datasetApi } from '@/lib/api-client';
import {
  Database,
  UploadCloud,
  FileSpreadsheet,
  Plus,
  Search,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface DatasetItem {
  id: string;
  name: string;
  size_bytes: number;
  total_rows: number;
  total_columns: number;
  has_ai_analysis: boolean;
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDatasets = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await datasetApi.listDatasets();
      setDatasets(res.datasets || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch datasets from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      await datasetApi.uploadDataset(file);
      await fetchDatasets();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to upload dataset.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredDatasets = datasets.filter((ds) =>
    ds.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <Database className="w-6 h-6 text-indigo-400" />
              Datasets & Ingestion
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Upload real CSV, Excel, Parquet, or JSON files processed via DuckDB and PostgreSQL.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDatasets}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-md text-xs transition-colors"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isUploading ? 'Uploading & Profiling...' : 'Upload File'}</span>
            </button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.parquet,.json"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Drag & Drop Upload Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-8 bg-slate-900/30 hover:bg-slate-900/50 transition-all text-center relative overflow-hidden group cursor-pointer"
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <h3 className="text-sm font-semibold text-slate-200">
                Profiling dataset & building DuckDB columnar indices...
              </h3>
              <p className="text-xs text-slate-400">Please wait while backend processes the file.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">
                Click to upload CSV, Excel, Parquet, or JSON dataset
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Files are stored and analyzed using embedded DuckDB and PostgreSQL.
              </p>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search uploaded datasets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-md pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Datasets List */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Dataset Name</th>
                  <th className="py-3 px-4">Dimensions</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">AI Analysis</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Loading datasets from FastAPI backend...
                    </td>
                  </tr>
                ) : filteredDatasets.length > 0 ? (
                  filteredDatasets.map((dataset) => (
                    <tr key={dataset.id} className="hover:bg-slate-900/40 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <div>
                            <Link
                              href={`/datasets/${dataset.id}`}
                              className="font-medium text-slate-200 font-sans hover:text-indigo-400 transition-colors"
                            >
                              {dataset.name}
                            </Link>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {dataset.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {dataset.total_rows.toLocaleString()} rows &bull; {dataset.total_columns} cols
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{formatBytes(dataset.size_bytes)}</td>
                      <td className="py-3.5 px-4">
                        {dataset.has_ai_analysis ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                            Analyzed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 font-sans">
                            Pending Scan
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/datasets/${dataset.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded text-xs font-sans font-medium transition-all"
                        >
                          <span>Inspect Grid & Charts</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500 font-sans">
                      No uploaded datasets found. Upload a CSV or Excel file to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
