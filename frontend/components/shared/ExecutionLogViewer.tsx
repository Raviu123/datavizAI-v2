'use client';

import React from 'react';
import { Terminal, X, Copy, Check, Trash2 } from 'lucide-react';

interface ExecutionLogViewerProps {
  logs: string[];
  isOpen: boolean;
  onClose: () => void;
  onClearLogs?: () => void;
}

export const ExecutionLogViewer: React.FC<ExecutionLogViewerProps> = ({
  logs,
  isOpen,
  onClose,
  onClearLogs,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full md:w-[600px] bg-slate-950 border-t md:border-l border-slate-800 shadow-2xl rounded-t-xl overflow-hidden font-mono text-xs flex flex-col max-h-[400px]">
      {/* Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold">
          <Terminal className="w-4 h-4" />
          <span>Real-time System & AI Execution Logs</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300">
            {logs.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              title="Clear Console Logs"
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={copyToClipboard}
            title="Copy Logs"
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            title="Close Panel"
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal View Body */}
      <div className="p-4 overflow-y-auto space-y-1.5 bg-slate-950 text-slate-300 flex-1 min-h-[160px]">
        {logs.length === 0 ? (
          <p className="text-slate-600 italic">No execution events logged yet...</p>
        ) : (
          logs.map((log, index) => {
            const isDuckDB = log.includes('DuckDB');
            const isLLM = log.includes('LLM') || log.includes('OpenRouter');
            const isErr = log.toLowerCase().includes('error') || log.toLowerCase().includes('exception');

            return (
              <div key={index} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-600 select-none">&gt;</span>
                <span
                  className={
                    isErr
                      ? 'text-rose-400 font-semibold'
                      : isDuckDB
                      ? 'text-cyan-400'
                      : isLLM
                      ? 'text-amber-300'
                      : 'text-slate-300'
                  }
                >
                  {log}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
