"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MOCK_DASHBOARDS } from "@/lib/mock-data";
import {
  BarChart3,
  Plus,
  ArrowUpRight,
  Search,
  LayoutGrid,
  Sparkles,
  Clock,
  User,
  Share2,
} from "lucide-react";

export default function DashboardsPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_DASHBOARDS.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              Dashboards & Canvas
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Interactive multi-widget dashboards powered by natural language queries and DuckDB.
            </p>
          </div>
          <Link
            href="/dashboards/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Create New Dashboard
          </Link>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search dashboards by title or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-md pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Dashboards Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((dashboard) => (
            <div
              key={dashboard.id}
              className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between group transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {dashboard.widgetsCount} Widgets
                  </span>
                  <Link
                    href={`/dashboards/${dashboard.id}`}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 group-hover:text-indigo-400 transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                <Link href={`/dashboards/${dashboard.id}`} className="block mt-3">
                  <h3 className="text-base font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
                    {dashboard.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-2">
                    {dashboard.description}
                  </p>
                </Link>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {dashboard.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-950 text-slate-400 border border-slate-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" /> {dashboard.author}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" /> {dashboard.lastModified}
                </span>
              </div>
            </div>
          ))}

          {/* Create Blank Dashboard Card */}
          <Link
            href="/dashboards/new"
            className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/20 hover:bg-slate-900/40 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all group min-h-[220px]"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-400 flex items-center justify-center mb-3 transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Create Blank Dashboard</h3>
            <p className="text-xs text-slate-400 mt-1">
              Add customized charts, tables, and AI insights canvas
            </p>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
