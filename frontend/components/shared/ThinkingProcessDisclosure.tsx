'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Terminal, Database, CheckCircle2, Loader2 } from 'lucide-react';

export interface ThinkingStep {
  id: string;
  type: 'thought' | 'tool_call' | 'tool_result';
  step?: number;
  content?: string;
  tool?: string;
  query?: string;
  result?: any;
}

interface ThinkingProcessDisclosureProps {
  steps: ThinkingStep[];
  isStreaming?: boolean;
}

export const ThinkingProcessDisclosure: React.FC<ThinkingProcessDisclosureProps> = ({
  steps,
  isStreaming = false,
}) => {
  // If streaming, stay open so user sees real-time reasoning. When finished, default closed.
  const [isOpen, setIsOpen] = useState<boolean>(isStreaming);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="w-full my-2 font-sans text-xs">
      {/* Header Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 text-slate-300 transition-colors w-full text-left group"
      >
        <div className="flex items-center gap-1.5 shrink-0">
          {isStreaming ? (
            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          ) : (
            <Brain className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300" />
          )}
          <span className="font-medium text-[11px] text-indigo-300">
            {isStreaming ? 'Thinking & querying dataset...' : `Thought process (${steps.length} steps)`}
          </span>
        </div>

        <div className="flex-1" />

        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <span>{isOpen ? 'Hide reasoning' : 'Show reasoning'}</span>
          {isOpen ? (
            <ChevronUp className="w-3 h-3 text-slate-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Step Log */}
      {isOpen && (
        <div className="mt-2 p-3 bg-slate-950/95 border border-slate-800/90 rounded-xl space-y-2.5 max-h-80 overflow-y-auto text-[11px] font-mono leading-relaxed">
          {steps.map((st, idx) => {
            if (st.type === 'thought') {
              return (
                <div key={st.id || idx} className="flex items-start gap-2 text-slate-300 bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                  <Brain className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="flex-1 whitespace-pre-wrap font-sans text-xs text-slate-300">
                    {st.content}
                  </div>
                </div>
              );
            }

            if (st.type === 'tool_call') {
              return (
                <div key={st.id || idx} className="bg-slate-900 p-2 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-[10px]">
                    <Terminal className="w-3 h-3 text-indigo-400" />
                    <span>Tool Call: {st.tool || 'execute_sql'}</span>
                  </div>
                  {st.query && (
                    <pre className="text-[10px] text-amber-200/90 bg-slate-950 p-2 rounded border border-slate-800/80 overflow-x-auto whitespace-pre-wrap">
                      {st.query}
                    </pre>
                  )}
                </div>
              );
            }

            if (st.type === 'tool_result') {
              return (
                <div key={st.id || idx} className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 space-y-1 text-slate-400">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Observation: {st.result?.row_count ?? 0} rows returned</span>
                  </div>
                  {st.result?.sample && (
                    <pre className="text-[10px] text-slate-300 bg-slate-950 p-1.5 rounded overflow-x-auto max-h-32">
                      {typeof st.result.sample === 'string'
                        ? st.result.sample
                        : JSON.stringify(st.result.sample, null, 2)}
                    </pre>
                  )}
                </div>
              );
            }

            return null;
          })}

          {isStreaming && (
            <div className="flex items-center gap-2 text-[10px] text-indigo-400 animate-pulse pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              Evaluating findings and synthesizing response...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
