"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  MOCK_METRICS,
  MOCK_DATASETS,
  MOCK_DASHBOARDS,
  MOCK_SALES_REVENUE_SERIES,
} from "@/lib/mock-data";
import {
  TrendingUp,
  ArrowUpRight,
  Database,
  BarChart3,
  Sparkles,
  Plus,
  ArrowRight,
  Zap,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DashboardOverviewPage() {
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Executive Intelligence Workspace
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time analytics, automated insights, and connected datasets.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/ai-chat"
              className="px-3.5 py-2 rounded-md bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-medium flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI Assistant
            </Link>
            <Link
              href="/datasets?action=upload"
              className="px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Upload Data
            </Link>
          </div>
        </div>

        {/* Top KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_METRICS.map((metric) => (
            <div
              key={metric.id}
              className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700/80 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{metric.title}</span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                    metric.isPositive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  {metric.change}
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-100 tracking-tight">
                  {metric.value}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{metric.period}</div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Insight Highlight Banner */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/60 border border-indigo-500/30 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Automated Insight Detected
                </span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  DuckDB Fast Scan
                </span>
              </div>
              <p className="text-sm font-medium text-slate-200">
                Revenue grew by <span className="text-emerald-400 font-semibold">14.2%</span> in Q3, driven by a <span className="text-indigo-400 font-semibold">32% expansion</span> in Enterprise SaaS tiers.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Self-serve conversion rates remained stable at 4.2%. Primary growth vector remains high-ACV expansion.
              </p>
            </div>
          </div>
        </div>

        {/* Main Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visualization Card (2 Cols) */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Revenue Velocity & Targets
                </h3>
                <p className="text-xs text-slate-400">
                  Monthly recurring revenue (MRR) performance across segments
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                8 Months
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_SALES_REVENUE_SERIES} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#f8fafc",
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 mt-4 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600" /> Target
                </span>
              </div>
              <Link href="/explore" className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                Explore in detail <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Quick Datasets Summary (1 Col) */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Active Datasets</h3>
                </div>
                <Link href="/datasets" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                  View all
                </Link>
              </div>

              <div className="space-y-3">
                {MOCK_DATASETS.slice(0, 3).map((dataset) => (
                  <Link
                    key={dataset.id}
                    href={`/datasets/${dataset.id}`}
                    className="block p-3 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:border-slate-700/80 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-xs font-medium text-slate-200 truncate max-w-[150px]">
                          {dataset.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{dataset.fileSize}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                      <span>{dataset.rowCount}</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {dataset.qualityScore}% Quality
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/datasets?action=upload"
              className="mt-4 w-full py-2 border border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-600/5 rounded-lg text-xs font-medium text-slate-300 hover:text-indigo-400 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Drop CSV/Excel to Analyze
            </Link>
          </div>
        </div>

        {/* Featured Dashboards Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-semibold text-slate-200">Interactive Dashboards</h2>
            </div>
            <Link href="/dashboards" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              Browse Dashboards &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_DASHBOARDS.map((dashboard) => (
              <Link
                key={dashboard.id}
                href={`/dashboards/${dashboard.id}`}
                className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between group transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                      {dashboard.title}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {dashboard.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {dashboard.widgetsCount} Widgets
                    </span>
                  </div>
                  <span>Modified {dashboard.lastModified}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
