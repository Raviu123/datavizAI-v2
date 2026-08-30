'use client';

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Database, Plus, Server, CheckCircle2 } from 'lucide-react';

export default function DataSourcesPage() {
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <Server className="w-6 h-6 text-indigo-400" />
              Connected Data Sources
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage database connections (PostgreSQL, MySQL, Snowflake) and file storages.
            </p>
          </div>
        </div>

        {/* PostgreSQL Docker Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">PostgreSQL (Docker Compose)</h3>
                <p className="text-xs text-slate-400 font-mono">localhost:5432 / datavizai</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">DuckDB Embedded Engine</h3>
                <p className="text-xs text-slate-400 font-mono">In-Memory / Local Storage Engine</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
