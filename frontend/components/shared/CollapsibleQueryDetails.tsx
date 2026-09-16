'use client';

import React, { useState } from 'react';
import { Code2, ChevronDown, ChevronUp, Copy, Check, Database } from 'lucide-react';

interface CollapsibleQueryDetailsProps {
  sql?: string;
  chartDataCount?: number;
}

export const CollapsibleQueryDetails: React.FC<CollapsibleQueryDetailsProps> = ({
  sql,
  chartDataCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!sql) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sql);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="pt-2 border-t border-slate-800/80">
      {/* Collapsible Dropdown Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors w-fit cursor-pointer"
      >
        <Code2 className="w-3 h-3 text-indigo-400 shrink-0" />
        <span>{isExpanded ? 'Hide Query Details' : 'Show Executed SQL Query'}</span>
        {chartDataCount !== undefined && chartDataCount > 0 && (
          <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded font-sans">
            {chartDataCount} rows
          </span>
        )}
        {isExpanded ? (
          <ChevronUp className="w-3 h-3 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
        )}
      </button>

      {/* Expanded Details Container */}
      {isExpanded && (
        <div className="mt-2 bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <Database className="w-3 h-3 text-indigo-400" /> Auto-Generated DuckDB Query
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <pre className="bg-slate-900 p-2.5 rounded-lg text-[11px] font-mono text-indigo-300 border border-slate-800/80 leading-relaxed whitespace-pre-wrap break-words">
            {sql}
          </pre>
        </div>
      )}
    </div>
  );
};
