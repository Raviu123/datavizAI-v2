"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MOCK_DATASETS } from "@/lib/mock-data";
import {
  Database,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function DatasetsPage() {
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSimulatedUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsUploading(false), 800);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  const filteredDatasets = MOCK_DATASETS.filter((ds) =>
    ds.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <Database className="w-6 h-6 text-indigo-400" />
              Datasets & Files
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Upload CSV, Excel, JSON, Parquet files or manage connected table views.
            </p>
          </div>
          <button
            onClick={handleSimulatedUpload}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Upload New File
          </button>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-8 bg-slate-900/30 hover:bg-slate-900/50 transition-all text-center relative overflow-hidden group">
          {isUploading ? (
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>Profiling and loading schema...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Detecting data types, missing values, and DuckDB columnar indexes...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center cursor-pointer" onClick={handleSimulatedUpload}>
              <div className="w-12 h-12 rounded-full bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">
                Click to upload or drag & drop dataset files
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Supports CSV, XLSX, Parquet, JSON. Files are processed securely via local DuckDB engine.
              </p>
            </div>
          )}
        </div>

        {/* Controls and Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search datasets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-md pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Filter by Format
            </button>
          </div>
        </div>

        {/* Datasets Table */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Dataset Name</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Dimensions</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Quality Score</th>
                  <th className="py-3 px-4">Last Sync</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredDatasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-slate-900/40 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <Link
                            href={`/datasets/${dataset.id}`}
                            className="font-medium text-slate-200 hover:text-indigo-400 transition-colors"
                          >
                            {dataset.name}
                          </Link>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {dataset.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {dataset.sourceType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {dataset.rowCount} &bull; {dataset.columnCount} cols
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{dataset.fileSize}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{dataset.qualityScore}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{dataset.lastUpdated}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/datasets/${dataset.id}`}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition-colors flex items-center gap-1"
                        >
                          Explore <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
