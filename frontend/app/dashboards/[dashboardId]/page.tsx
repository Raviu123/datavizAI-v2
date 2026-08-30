"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MOCK_SALES_REVENUE_SERIES } from "@/lib/mock-data";
import {
  ArrowLeft,
  Sparkles,
  Share2,
  Plus,
  Filter,
  BarChart3,
  TrendingUp,
  Download,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DashboardCanvasPage() {
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Canvas Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboards"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-100">
                Executive Revenue & Churn Performance
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Dataset: <span className="text-indigo-400 font-mono">q3_global_sales_transactions.csv</span> &bull; 8 Live Widgets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-md text-xs font-medium flex items-center gap-1.5 hover:bg-slate-800 transition-colors">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter View
            </button>
            <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Add Widget
            </button>
          </div>
        </div>

        {/* Dashboard Grid Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Top Left Widget: Primary Revenue Area Chart */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">MRR Trajectory & Target Forecast</h3>
                <p className="text-xs text-slate-400">Monthly recurring revenue comparison against initial projection</p>
              </div>
              <span className="text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                +14.2% Growth
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_SALES_REVENUE_SERIES}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Right Widget: Enterprise vs Self-Serve Bar Chart */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Segment Breakdown</h3>
                <p className="text-xs text-slate-400">Enterprise vs Self-Serve contribution</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_SALES_REVENUE_SERIES}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="enterprise" fill="#6366f1" stackId="a" />
                  <Bar dataKey="selfServe" fill="#38bdf8" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Automated Synthesis Widget */}
          <div className="lg:col-span-3 bg-gradient-to-r from-indigo-950/40 via-slate-900/80 to-slate-900/40 border border-indigo-500/30 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> AI Workspace Summary
            </div>
            <p className="text-sm font-medium text-slate-200">
              Q3 MRR expanded by $21,000 month-over-month. Enterprise accounts contributed 64% of new ARR growth with average expansion velocity of 22 days per deal.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
