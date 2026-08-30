"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  FileSpreadsheet,
  Table as TableIcon,
  BarChart2,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const MOCK_PREVIEW_ROWS = [
  { id: 1, customer: "Acme Corp", region: "North America", segment: "Enterprise", plan: "Scale", mrr: 12500, status: "Active", renewal: "2026-11-15" },
  { id: 2, customer: "Starlight Tech", region: "Europe", segment: "Enterprise", plan: "Scale", mrr: 8400, status: "Active", renewal: "2026-10-01" },
  { id: 3, customer: "Nexus AI", region: "North America", segment: "Mid-Market", plan: "Growth", mrr: 3200, status: "Active", renewal: "2027-01-20" },
  { id: 4, customer: "Pulse Labs", region: "Asia Pacific", segment: "SMB", plan: "Starter", mrr: 450, status: "Churn Risk", renewal: "2026-09-05" },
  { id: 5, customer: "Vortex Gaming", region: "Europe", segment: "Mid-Market", plan: "Growth", mrr: 4100, status: "Active", renewal: "2026-12-12" },
  { id: 6, customer: "Omni Global", region: "Latin America", segment: "Enterprise", plan: "Scale", mrr: 15000, status: "Active", renewal: "2027-03-30" },
];

const MOCK_REGION_DISTRIBUTION = [
  { region: "North America", count: 112 },
  { region: "Europe", count: 78 },
  { region: "Asia Pacific", count: 42 },
  { region: "Latin America", count: 16 },
];

export default function DatasetDetailPage() {
  const [activeTab, setActiveTab] = useState<"preview" | "profiling" | "clean">("preview");

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Breadcrumb & Actions */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/datasets"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                <h1 className="text-xl font-bold text-slate-100">q3_global_sales_transactions.csv</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready (DuckDB Scan)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                248,500 rows &bull; 18 columns &bull; 42.5 MB &bull; Uploaded 10 mins ago
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/explore"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium flex items-center gap-2 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Query with AI
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("preview")}
            className={`pb-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "preview"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <TableIcon className="w-4 h-4" />
            Data Preview & Grid
          </button>
          <button
            onClick={() => setActiveTab("profiling")}
            className={`pb-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "profiling"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Data Profiling & Quality
          </button>
        </div>

        {/* Content based on tab */}
        {activeTab === "preview" ? (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-72">
                <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter rows in grid..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Showing 1-6 of 248,500 sample records
              </div>
            </div>

            {/* Grid Table */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4"># ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Region</th>
                      <th className="py-3 px-4">Segment</th>
                      <th className="py-3 px-4">Plan Tier</th>
                      <th className="py-3 px-4">MRR ($)</th>
                      <th className="py-3 px-4">Health Status</th>
                      <th className="py-3 px-4">Renewal Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                    {MOCK_PREVIEW_ROWS.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 text-slate-500">{row.id}</td>
                        <td className="py-3 px-4 text-slate-200 font-sans font-medium">{row.customer}</td>
                        <td className="py-3 px-4 text-slate-300">{row.region}</td>
                        <td className="py-3 px-4 text-slate-300">{row.segment}</td>
                        <td className="py-3 px-4 text-indigo-400">{row.plan}</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">${row.mrr.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-sans ${
                              row.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{row.renewal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profiling Grid Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
                <div className="text-xs text-slate-400 mb-1">Completeness Score</div>
                <div className="text-2xl font-bold text-emerald-400">98.4%</div>
                <div className="text-[11px] text-slate-500 mt-1">4 non-critical null cells found</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
                <div className="text-xs text-slate-400 mb-1">Detected Primary Key</div>
                <div className="text-sm font-semibold text-slate-200 font-mono">transaction_id (Unique)</div>
                <div className="text-[11px] text-slate-500 mt-1">No duplicate rows detected</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
                <div className="text-xs text-slate-400 mb-1">Inferred Time Column</div>
                <div className="text-sm font-semibold text-indigo-400 font-mono">created_at (Timestamp)</div>
                <div className="text-[11px] text-slate-500 mt-1">Time range: Jan 2026 - Aug 2026</div>
              </div>
            </div>

            {/* Categorical Distribution Breakdown */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-1">Region Distribution Breakdown</h3>
              <p className="text-xs text-slate-400 mb-4">Value frequency profiling for categorical field &apos;region&apos;</p>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_REGION_DISTRIBUTION}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="region" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
