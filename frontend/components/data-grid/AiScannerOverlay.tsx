'use client';

import React from 'react';
import { Sparkles, Brain, Cpu, CheckCircle2 } from 'lucide-react';

interface AiScannerOverlayProps {
  isAnalyzing: boolean;
  activeStep?: string;
  columns?: string[];
}

export const AiScannerOverlay: React.FC<AiScannerOverlayProps> = ({
  isAnalyzing,
  activeStep = "Scanning dataset structure & profiling columns...",
  columns = [],
}) => {
  if (!isAnalyzing) return null;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-xl border-2 border-indigo-500/50 bg-indigo-950/10 backdrop-blur-[1px]">
      {/* Laser / Scanner Sweep Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-[scan_2.5s_ease-in-out_infinite]" />

      {/* Floating AI Agent Intelligence Status Badge */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-3 bg-slate-900/90 border border-indigo-500/40 rounded-lg px-4 py-2.5 shadow-xl backdrop-blur-md">
        <div className="relative flex items-center justify-center">
          <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
        </div>
        <div>
          <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
            <span>AI AGENT ACTIVE</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/80 text-indigo-300 font-mono">OpenRouter</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">{activeStep}</p>
        </div>
      </div>

      {/* Column Pulse Highlights */}
      {columns.length > 0 && (
        <div className="absolute top-12 left-6 flex gap-2">
          {columns.slice(0, 5).map((col, idx) => (
            <div
              key={col}
              className="text-[11px] font-mono px-2 py-1 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 flex items-center gap-1 shadow-[0_0_10px_rgba(34,211,238,0.2)] animate-pulse"
              style={{ animationDelay: `${idx * 200}ms` }}
            >
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>Analyzing: {col}</span>
            </div>
          ))}
        </div>
      )}

      {/* Grid Laser Sweep Styling Keyframe */}
      <style jsx global>{`
        @keyframes scan {
          0% {
            top: 0%;
            opacity: 0.8;
          }
          50% {
            top: 98%;
            opacity: 1;
          }
          100% {
            top: 0%;
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};
