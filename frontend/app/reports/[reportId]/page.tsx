'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { ChartEngine } from '@/components/charts/ChartEngine';
import { reportsApi } from '@/lib/api-client';
import {
  FileText,
  Printer,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  Clock,
  Code2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Share2,
} from 'lucide-react';

interface ReportPageProps {
  params: Promise<{ reportId: string }>;
}

export default function ExecutiveReportDetailPage({ params }: ReportPageProps) {
  const resolvedParams = use(params);
  const reportId = resolvedParams.reportId;

  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedSql, setExpandedSql] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchReport() {
      try {
        const data = await reportsApi.getReport(reportId);
        setReport(data);
      } catch (err: any) {
        setErrorMsg(err.response?.data?.detail || 'Failed to load executive report.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [reportId]);

  const toggleSql = (id: string) => {
    setExpandedSql((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-200">Retrieving Executive Intelligence Dossier...</h2>
          <p className="text-xs text-slate-400">Loading verified DuckDB data points and narrative sections.</p>
        </div>
      </AppShell>
    );
  }

  if (errorMsg || !report) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 w-12 h-12 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-100">Report Not Found</h2>
          <p className="text-xs text-slate-400">{errorMsg || 'The requested executive report could not be found.'}</p>
          <Link
            href="/dashboards"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboards</span>
          </Link>
        </div>
      </AppShell>
    );
  }

  const { title, executive_summary, kpis = [], sections = [], anomalies = [], recommendations = [], orchestration_logs = [], created_at } = report;

  return (
    <AppShell>
      {/* Print-specific style overrides */}
      <style jsx global>{`
        @media print {
          nav, header, aside, button, .no-print {
            display: none !important;
          }
          body, main {
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .print-card {
            border: 1px solid #cbd5e1 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Navigation & Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 no-print">
          <Link
            href={`/datasets/${report.dataset_id}`}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Ingested Dataset</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Download PDF / Print Dossier</span>
            </button>
          </div>
        </div>

        {/* Executive Header */}
        <div className="space-y-3 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl print-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Autonomous Multi-Agent Intelligence Dossier
              </span>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {created_at ? new Date(created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Generated'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Report ID: {reportId.slice(0, 8)}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            {title}
          </h1>

          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Synthesized autonomously by DataViz AI's 5-Agent Pipeline combining DuckDB vectorized SQL execution with C-suite strategic reasoning.
          </p>
        </div>

        {/* Executive Summary Memo */}
        <div className="bg-slate-900/70 border border-indigo-500/30 rounded-2xl p-6 space-y-3 shadow-lg print-card">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Executive Briefing & Synthesis</span>
          </div>
          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
            {executive_summary}
          </div>
        </div>

        {/* High-Level KPI Scorecards */}
        {kpis.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {kpis.map((kpi: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-1 shadow-sm print-card"
              >
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                  {kpi.label}
                </span>
                <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
                  {kpi.value}
                </div>
                {kpi.subtext && (
                  <p className="text-[10px] text-slate-500 font-mono pt-1">
                    {kpi.subtext}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Deep-Dive Investigation Sections with Embedded Interactive Charts */}
        <div className="space-y-8">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Core Analytical Investigations & Visual Evidence</span>
          </h2>

          {sections.map((section: any, idx: number) => (
            <div
              key={section.id || idx}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg print-card"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/60 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono text-[11px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="text-base font-bold text-slate-100">
                      {section.title}
                    </h3>
                  </div>
                  {section.business_question && (
                    <p className="text-xs text-indigo-300 font-medium italic pl-7">
                      &quot;{section.business_question}&quot;
                    </p>
                  )}
                </div>

                {section.sql && (
                  <button
                    onClick={() => toggleSql(section.id || String(idx))}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono self-start no-print"
                  >
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>SQL Query</span>
                    {expandedSql[section.id || String(idx)] ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>

              {/* Collapsible SQL View */}
              {expandedSql[section.id || String(idx)] && section.sql && (
                <pre className="bg-slate-950 p-3 rounded-lg text-[11px] font-mono text-emerald-400 leading-relaxed overflow-x-auto border border-slate-800 whitespace-pre-wrap no-print">
                  {section.sql}
                </pre>
              )}

              {/* Narrative Text */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {section.narrative}
              </p>

              {/* Embedded Chart */}
              {section.chart && (
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4">
                  <ChartEngine strategy={section.chart} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Statistical Anomalies & Outlier Flags */}
        {anomalies.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg print-card">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Statistical Anomaly Callouts & Risk Factors</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anomalies.map((anom: any, idx: number) => {
                const isCrit = anom.severity === 'critical';
                const isWarn = anom.severity === 'warning';
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                      isCrit
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                        : isWarn
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">{anom.title}</span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border">
                        {anom.severity || 'info'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {anom.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Strategic C-Suite Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg print-card">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 text-emerald-400">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              <span>Strategic Action Items & Recommendations</span>
            </h2>
            <div className="space-y-3">
              {recommendations.map((rec: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-100">{rec.action}</span>
                      {rec.impact && (
                        <p className="text-[11px] text-slate-400">
                          <strong className="text-slate-300 font-semibold">Projected Impact: </strong>
                          {rec.impact}
                        </p>
                      )}
                    </div>
                  </div>
                  {rec.priority && (
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-center shrink-0">
                      {rec.priority} Priority
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multi-Agent Orchestration Logs (Audit Trail) */}
        {orchestration_logs.length > 0 && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono no-print">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Multi-Agent Orchestration Audit Trail
            </span>
            <div className="space-y-1 text-slate-400 text-[11px] max-h-36 overflow-y-auto">
              {orchestration_logs.map((log: string, lIdx: number) => (
                <div key={lIdx} className="truncate">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
