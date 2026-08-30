"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  Sparkles,
  Compass,
  Play,
  Copy,
  Check,
  Code2,
  Table,
  BarChart2,
  PieChart as PieIcon,
  Download,
  FileSpreadsheet,
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

const SAMPLE_SQL = `SELECT 
    region,
    COUNT(id) AS total_customers,
    ROUND(SUM(mrr), 2) AS total_mrr
FROM q3_sales_transactions
WHERE status = 'Active'
GROUP BY region
ORDER BY total_mrr DESC;`;

const MOCK_QUERY_RESULTS = [
  { region: "North America", total_customers: 112, total_mrr: 842500 },
  { region: "Europe", total_customers: 78, total_mrr: 412000 },
  { region: "Asia Pacific", total_customers: 42, total_mrr: 185400 },
  { region: "Latin America", total_customers: 16, total_mrr: 43000 },
];

export default function ExploreQueryPage() {
  const [nlQuery, setNlQuery] = useState("Show me total MRR breakdown by region for active customers");
  const [viewMode, setViewMode] = useState<"table" | "chart">("chart");
  const [isExecuting, setIsExecuting] = useState(false);

  const handleRun = () => {
    setIsExecuting(true);
    setTimeout(() => setIsExecuting(false), 500);
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800/60 pb-5">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-400" />
            Explore & Natural Language Query
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ask questions in plain English or write SQL directly against your DuckDB in-memory engine.
          </p>
        </div>

        {/* Natural Language AI Input Prompt Box */}
        <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-4 space-y-3 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Natural Language AI Data Exploration
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="e.g. Compare monthly revenue between Enterprise and Self-Serve segments..."
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
            <button
              onClick={handleRun}
              disabled={isExecuting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-all shrink-0 shadow-md shadow-indigo-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isExecuting ? "Executing..." : "Generate SQL & Run"}
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
            <span className="text-slate-500">Quick prompts:</span>
            {["Top 5 customers by MRR", "Churn risk breakdown", "Q3 vs Q2 expansion"].map((p) => (
              <button
                key={p}
                onClick={() => setNlQuery(p)}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Generated SQL & Result Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generated SQL Code Box */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  Generated DuckDB SQL
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Valid SQL
                </span>
              </div>
              <pre className="bg-slate-950 p-3 rounded-lg text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto border border-slate-800/80">
                {SAMPLE_SQL}
              </pre>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
              <span>Execution Time: <strong className="text-indigo-400 font-mono">4.2ms</strong></span>
              <span>Engine: <strong className="text-slate-300">DuckDB Vectorized</strong></span>
            </div>
          </div>

          {/* Visualization / Data Output */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("chart")}
                  className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    viewMode === "chart"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" /> Chart View
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    viewMode === "table"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Table className="w-3.5 h-3.5" /> Table View
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1">
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              </div>
            </div>

            {viewMode === "chart" ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_QUERY_RESULTS}>
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
                    <Bar dataKey="total_mrr" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Region</th>
                      <th className="py-2.5 px-3">Total Customers</th>
                      <th className="py-2.5 px-3">Total MRR ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {MOCK_QUERY_RESULTS.map((row) => (
                      <tr key={row.region} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-sans font-medium">{row.region}</td>
                        <td className="py-2.5 px-3">{row.total_customers}</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-semibold">${row.total_mrr.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
