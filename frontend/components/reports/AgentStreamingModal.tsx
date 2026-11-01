'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { reportsApi } from '@/lib/api-client';
import {
  Sparkles,
  Brain,
  Terminal,
  Database,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  BarChart2,
  PieChart,
  Loader2,
  X,
  RefreshCw,
  Search,
  Activity,
  Layers,
} from 'lucide-react';

export interface StreamEvent {
  id?: string;
  type:
    | 'start'
    | 'tier_start'
    | 'tier_complete'
    | 'thought'
    | 'tool_call'
    | 'tool_result'
    | 'discovery'
    | 'anomaly_found'
    | 'kpis_ready'
    | 'complete'
    | 'error';
  tier?: number;
  tier_name?: string;
  agent?: string;
  message?: string;
  thought?: string;
  cycle?: number;
  max_cycles?: number;
  action?: string;
  params?: any;
  sql?: string;
  observation?: string;
  sample_data?: any[];
  discovery?: any;
  anomaly?: any;
  details?: any;
  report?: any;
  total_elapsed?: number;
  timestamp?: string;
}

interface AgentStreamingModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  datasetName: string;
  onReportGenerated?: (report: any) => void;
}

const TIERS = [
  { tier: 1, name: 'Semantic Inference', agent: 'Semantic Inferrer', icon: Brain },
  { tier: 2, name: 'Anomaly Scout', agent: 'Anomaly Scout', icon: AlertTriangle },
  { tier: 3, name: 'ReAct Forensic Loop', agent: 'Forensic Investigator', icon: Database },
  { tier: 4, name: 'Visual Architecture', agent: 'Chart Designer', icon: BarChart2 },
  { tier: 5, name: 'Executive Synthesis', agent: 'Executive Synthesizer', icon: Sparkles },
  { tier: 6, name: 'Critic Reflection', agent: 'Fact-Checker Critic', icon: ShieldCheck },
];

export const AgentStreamingModal: React.FC<AgentStreamingModalProps> = ({
  isOpen,
  onClose,
  datasetId,
  datasetName,
  onReportGenerated,
}) => {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [currentTier, setCurrentTier] = useState<number>(1);
  const [currentAgent, setCurrentAgent] = useState<string>('Semantic Inferrer');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll handler
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  // Timer handler
  useEffect(() => {
    let interval: any = null;
    if (status === 'running') {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  // Start generation when modal opens
  useEffect(() => {
    if (isOpen && status === 'idle') {
      startGeneration();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen]);

  const startGeneration = async () => {
    setStatus('running');
    setEvents([]);
    setErrorMsg(null);
    setGeneratedReport(null);
    setElapsedSeconds(0);
    setCurrentTier(1);
    setCurrentAgent('Semantic Inferrer');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let eventIdx = 0;
      await reportsApi.generateReportStream(
        datasetId,
        (event: StreamEvent) => {
          const eventId = `evt_${Date.now()}_${eventIdx++}`;
          const enrichedEvent = { ...event, id: eventId };

          // Automatically expand new thoughts
          if (event.thought) {
            setExpandedThoughts((prev) => ({ ...prev, [eventId]: true }));
          }

          if (event.tier) {
            setCurrentTier(event.tier);
          }
          if (event.agent) {
            setCurrentAgent(event.agent);
          }

          if (event.type === 'complete' && event.report) {
            setStatus('completed');
            setGeneratedReport(event.report);
            if (onReportGenerated) {
              onReportGenerated(event.report);
            }
          }

          setEvents((prev) => [...prev, enrichedEvent]);
        },
        controller.signal
      );
    } catch (err: any) {
      if (controller.signal.aborted) return;
      console.error('[Agent Streaming Error]', err);
      setStatus('error');
      setErrorMsg(err.message || 'Failed to complete agentic reporting pipeline.');
    }
  };

  const toggleThought = (id: string) => {
    setExpandedThoughts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-5xl h-[90vh] max-h-[900px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="bg-slate-950/90 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/30 text-purple-300">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Autonomous Multi-Agent Reporting Pipeline
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  6-Tier Architecture
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Live Reasoning, Forensic DuckDB Loops & Mathematical Verification &bull; Target:{' '}
                <span className="text-slate-200 font-medium">{datasetName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Clock Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>

            {/* Status Pill */}
            {status === 'running' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>Tier {currentTier}: {currentAgent}</span>
              </div>
            )}

            {status === 'completed' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified Dossier Ready</span>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Pipeline Error</span>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 6-Tier Pipeline Timeline Stepper */}
        <div className="bg-slate-950/60 border-b border-slate-800/60 px-6 py-3 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-[700px] gap-2">
            {TIERS.map((t, idx) => {
              const isPast = currentTier > t.tier || status === 'completed';
              const isCurrent = currentTier === t.tier && status === 'running';
              const Icon = t.icon;

              return (
                <div key={t.tier} className="flex-1 flex items-center gap-2">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all w-full ${
                      isPast
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        : isCurrent
                        ? 'bg-indigo-950/40 border-indigo-500/60 text-indigo-200 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                        : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                    }`}
                  >
                    <div className="shrink-0">
                      {isPast ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                      ) : (
                        <Icon className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold truncate text-[11px]">{t.name}</div>
                      <div className="text-[9px] text-slate-400 truncate">{t.agent}</div>
                    </div>
                  </div>
                  {idx < TIERS.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0 select-none" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Stream Body (Claude Code / AI Tool Step View) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 font-sans bg-gradient-to-b from-slate-950/40 to-slate-900/60"
        >
          {events.length === 0 && status === 'running' && (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm font-medium text-slate-300">
                Contacting Autonomous Multi-Agent Orchestrator...
              </p>
              <p className="text-xs text-slate-500">
                Initializing in-memory DuckDB sandbox and OpenRouter reasoning models.
              </p>
            </div>
          )}

          {events.map((evt, index) => {
            const isThoughtExpanded = evt.id ? !!expandedThoughts[evt.id] : true;

            // 1. Pipeline Start
            if (evt.type === 'start') {
              return (
                <div
                  key={evt.id || index}
                  className="flex items-center gap-2 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-indigo-300 text-xs"
                >
                  <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-semibold">Pipeline Initialized:</span>
                  <span className="text-slate-300">{evt.message}</span>
                  <span className="ml-auto text-[10px] text-slate-500 font-mono">{evt.timestamp}</span>
                </div>
              );
            }

            // 2. Stage/Tier Starts
            if (evt.type === 'tier_start') {
              return (
                <div
                  key={evt.id || index}
                  className="flex items-center justify-between border-l-2 border-indigo-500 pl-3 py-1 my-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Tier {evt.tier}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{evt.tier_name}</span>
                    <span className="text-xs text-slate-400">&bull; {evt.message}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{evt.timestamp}</span>
                </div>
              );
            }

            // 3. Thinking Process (Claude Code style expandable block)
            if (evt.type === 'thought' && evt.thought) {
              return (
                <div
                  key={evt.id || index}
                  className="rounded-xl border border-indigo-500/20 bg-slate-950/70 overflow-hidden shadow-sm"
                >
                  {/* Thinking Header Toggle */}
                  <button
                    onClick={() => evt.id && toggleThought(evt.id)}
                    className="w-full px-4 py-2 bg-indigo-950/20 hover:bg-indigo-950/30 flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <Brain className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-semibold text-indigo-300">Thinking Process</span>
                      {evt.agent && (
                        <span className="text-[10px] font-mono text-slate-400">
                          [{evt.agent}{evt.cycle ? ` · Cycle ${evt.cycle}/${evt.max_cycles || 6}` : ''}]
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500">{evt.timestamp}</span>
                      {isThoughtExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Thinking Content */}
                  {isThoughtExpanded && (
                    <div className="p-4 border-t border-indigo-500/10 text-xs text-slate-300 leading-relaxed font-sans italic bg-indigo-950/5">
                      <p>{evt.thought}</p>
                    </div>
                  )}
                </div>
              );
            }

            // 4. Tool Call (DuckDB SQL / Correlation / Cohort)
            if (evt.type === 'tool_call') {
              const codeString = evt.sql || JSON.stringify(evt.params, null, 2);
              return (
                <div
                  key={evt.id || index}
                  className="rounded-xl border border-cyan-500/25 bg-slate-950/90 overflow-hidden font-mono text-xs shadow-md"
                >
                  <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Terminal className="w-3.5 h-3.5" />
                      <span className="font-semibold text-[11px]">Tool Call: {evt.action}</span>
                      {evt.agent && (
                        <span className="text-[10px] text-slate-400">by {evt.agent}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{evt.timestamp}</span>
                      {codeString && (
                        <button
                          onClick={() => copyToClipboard(codeString, evt.id || `${index}`)}
                          className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
                          title="Copy query"
                        >
                          {copiedId === (evt.id || `${index}`) ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {codeString && (
                    <div className="p-3 bg-slate-950 overflow-x-auto text-cyan-200/90 text-[11px] leading-relaxed">
                      <code>{codeString}</code>
                    </div>
                  )}
                </div>
              );
            }

            // 5. Tool Result / Observation
            if (evt.type === 'tool_result') {
              return (
                <div
                  key={evt.id || index}
                  className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5 font-mono"
                >
                  <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                        Observation &bull; {evt.action}
                      </span>
                      <span className="text-[10px] text-slate-500">{evt.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-200">{evt.observation}</p>
                    {evt.sample_data && evt.sample_data.length > 0 && (
                      <div className="mt-2 p-2 rounded bg-slate-950 text-[10px] text-slate-400 overflow-x-auto">
                        <pre>{JSON.stringify(evt.sample_data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // 6. Verified Discovery (High-impact finding proved by data)
            if (evt.type === 'discovery' && evt.discovery) {
              const d = evt.discovery;
              return (
                <div
                  key={evt.id || index}
                  className="rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 to-slate-900/60 p-4 space-y-2 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                        Verified Forensic Discovery
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Chart: {d.suggested_chart || 'interactive'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{evt.timestamp}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100">{d.title}</h4>
                  {d.business_claim && (
                    <p className="text-xs text-slate-300">{d.business_claim}</p>
                  )}
                  {d.sql && (
                    <div className="mt-1 p-2 rounded bg-slate-950 font-mono text-[10px] text-emerald-200/80 overflow-x-auto">
                      <code>{d.sql}</code>
                    </div>
                  )}
                </div>
              );
            }

            // 7. Anomalies Discovered
            if (evt.type === 'anomaly_found' && evt.anomaly) {
              const a = evt.anomaly;
              const isCrit = a.severity === 'critical';
              return (
                <div
                  key={evt.id || index}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    isCrit
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                      : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                  }`}
                >
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isCrit ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                        [{a.severity || 'anomaly'}] {a.column ? `Column: ${a.column}` : ''}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{evt.timestamp}</span>
                    </div>
                    <h5 className="font-semibold text-slate-100">{a.title}</h5>
                    <p className="text-[11px] text-slate-300">{a.description}</p>
                  </div>
                </div>
              );
            }

            // 8. Tier Complete
            if (evt.type === 'tier_complete') {
              return (
                <div
                  key={evt.id || index}
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/70 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold text-slate-200">{evt.agent}:</span>
                    <span className="text-slate-300">{evt.message}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{evt.timestamp}</span>
                </div>
              );
            }

            // 9. Pipeline Complete Celebratory Card
            if (evt.type === 'complete' && evt.report) {
              const rep = evt.report;
              return (
                <div
                  key={evt.id || index}
                  className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-indigo-950/30 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Synthesis & Audit Complete
                        </span>
                        <h3 className="text-lg font-bold text-slate-100 mt-1">{rep.title}</h3>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      Total Time: {evt.total_elapsed || elapsedSeconds}s
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {rep.executive_summary}
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    <Link
                      href={`/reports/${rep.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <span>Open Executive Dossier</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Close & Return
                    </button>
                  </div>
                </div>
              );
            }

            // 10. Generic or Fallback message
            return (
              <div key={evt.id || index} className="text-xs text-slate-400 pl-4 py-1">
                {evt.message || JSON.stringify(evt)}
              </div>
            );
          })}

          {/* Error Banner */}
          {status === 'error' && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h5 className="font-bold text-rose-100">Report Generation Interrupted</h5>
                <p className="text-slate-300">{errorMsg || 'An unexpected error occurred during execution.'}</p>
                <button
                  onClick={startGeneration}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Pipeline</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status & Control Bar */}
        <div className="bg-slate-950/90 border-t border-slate-800/80 px-6 py-3 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors cursor-pointer ${
                autoScroll
                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <span>Auto-scroll: {autoScroll ? 'ON' : 'OFF'}</span>
            </button>
            <span className="text-slate-500 text-[11px] font-mono">
              {events.length} agent events streamed
            </span>
          </div>

          <div className="flex items-center gap-3">
            {status === 'running' && (
              <div className="flex items-center gap-2 text-indigo-300 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Streaming live thoughts & queries...</span>
              </div>
            )}

            {status === 'completed' && generatedReport && (
              <Link
                href={`/reports/${generatedReport.id}`}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <span>View Full Report</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
            >
              {status === 'completed' ? 'Done' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
