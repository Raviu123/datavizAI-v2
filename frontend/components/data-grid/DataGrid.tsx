'use client';

import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Hash, Calendar, Type, Tag, CheckSquare, Sparkles, Loader2 } from 'lucide-react';
import { AiScannerOverlay } from './AiScannerOverlay';

interface ColumnMeta {
  name: string;
  inferred_type: string;
  null_percentage: number;
  unique_count: number;
  sample_values: any[];
}

interface DataGridProps {
  columns: ColumnMeta[];
  rows: Record<string, any>[];
  totalRows: number;
  isAiAnalyzing?: boolean;
  onRunAiAnalysis?: () => void;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

export const DataGrid: React.FC<DataGridProps> = ({
  columns = [],
  rows = [],
  totalRows,
  isAiAnalyzing = false,
  onRunAiAnalysis,
  currentPage: controlledPage,
  pageSize = 25,
  onPageChange,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [internalPage, setInternalPage] = useState(1);

  const isServerPaged = Boolean(onPageChange);
  const activePage = isServerPaged ? (controlledPage || 1) : internalPage;

  // Filter rows based on search
  const filteredRows = rows.filter((row) =>
    Object.values(row).some((val) =>
      String(val ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = isServerPaged
    ? Math.max(Math.ceil((totalRows || 1) / pageSize), 1)
    : Math.max(Math.ceil(filteredRows.length / pageSize), 1);

  const paginatedRows = isServerPaged
    ? filteredRows
    : filteredRows.slice((activePage - 1) * pageSize, activePage * pageSize);

  const handlePageClick = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (isServerPaged && onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'integer':
      case 'float':
      case 'numeric':
        return { label: '# Num', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: Hash };
      case 'datetime':
        return { label: '📅 Date', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Calendar };
      case 'categorical':
        return { label: '🏷️ Cat', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Tag };
      case 'boolean':
        return { label: '✓ Bool', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: CheckSquare };
      default:
        return { label: '🔤 Text', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Type };
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* AI Scanner Animation Overlay */}
      <AiScannerOverlay
        isAnalyzing={isAiAnalyzing}
        columns={columns.map((c) => c.name)}
        activeStep="AI Agent profiling cell distributions & evaluating visualization strategies..."
      />

      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter current view..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64 transition-all"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {totalRows ? totalRows.toLocaleString() : rows.length} total rows • {columns.length} columns
          </span>
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Streaming page...</span>
            </div>
          )}
        </div>

        {onRunAiAnalysis && (
          <button
            onClick={onRunAiAnalysis}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover Visual Strategies</span>
          </button>
        )}
      </div>

      {/* Tabular Cell Grid */}
      <div className="flex-1 overflow-auto bg-slate-950/40">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 sticky top-0 z-10 backdrop-blur">
              <th className="p-3 border-r border-slate-800/60 w-12 text-center text-slate-500 font-mono">
                #
              </th>
              {columns.map((col) => {
                const badge = getTypeBadge(col.inferred_type);
                return (
                  <th key={col.name} className="p-3 border-r border-slate-800/60 min-w-[160px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 truncate">{col.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>Nulls: {col.null_percentage}%</span>
                        <span>•</span>
                        <span>Unique: {col.unique_count}</span>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono">
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-indigo-950/20 transition-colors">
                  <td className="p-2.5 text-center text-slate-600 border-r border-slate-800/40 bg-slate-950/30">
                    {(activePage - 1) * pageSize + rIdx + 1}
                  </td>
                  {columns.map((col) => {
                    const val = row[col.name];
                    return (
                      <td key={col.name} className="p-2.5 border-r border-slate-800/40 truncate max-w-[240px]">
                        {val === null || val === undefined ? (
                          <span className="text-slate-600 italic">null</span>
                        ) : typeof val === 'boolean' ? (
                          <span className={val ? 'text-emerald-400' : 'text-rose-400'}>
                            {String(val)}
                          </span>
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-slate-500">
                  {isLoading ? 'Loading page from DuckDB...' : 'No records match your filter criteria.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between p-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
        <span className="font-mono">
          Page {activePage} of {totalPages} {isServerPaged && '(DuckDB streaming)'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageClick(activePage - 1)}
            disabled={activePage === 1 || isLoading}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono px-2 text-slate-300">{activePage}</span>
          <button
            onClick={() => handlePageClick(activePage + 1)}
            disabled={activePage >= totalPages || isLoading}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
