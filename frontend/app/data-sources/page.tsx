"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MOCK_DATA_SOURCES } from "@/lib/mock-data";
import {
  Link2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  Globe,
  HardDrive,
  ArrowUpRight,
  Search,
} from "lucide-react";

export default function DataSourcesPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <Link2 className="w-6 h-6 text-indigo-400" />
              Connected Data Sources
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Connect external databases, data warehouses, and live API streams to sync with DataViz AI.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Connect New Source
          </button>
        </div>

        {/* Integration Connector Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { name: "PostgreSQL", icon: Database, desc: "Direct connection to Postgres tables & views", popular: true },
            { name: "Snowflake", icon: Server, desc: "Enterprise cloud warehouse sync", popular: true },
            { name: "REST / Webhook", icon: Globe, desc: "HTTP JSON endpoints & webhooks", popular: false },
            { name: "BigQuery / MySQL", icon: HardDrive, desc: "Google BigQuery & MySQL DBs", popular: false },
          ].map((connector) => (
            <div
              key={connector.name}
              onClick={() => setShowAddModal(true)}
              className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl p-4 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <connector.icon className="w-5 h-5" />
                </div>
                {connector.popular && (
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                    Popular
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mt-3 group-hover:text-indigo-400 transition-colors">
                {connector.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{connector.desc}</p>
            </div>
          ))}
        </div>

        {/* Active Connections List */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Active Live Connectors</h2>
            <button className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Sync All Sources
            </button>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs">
            {MOCK_DATA_SOURCES.map((source) => (
              <div
                key={source.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-800 text-indigo-400 border border-slate-700 mt-0.5">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-200 text-sm">{source.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                        {source.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-1">{source.host}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {source.tablesCount} synced tables &bull; Last sync: {source.lastSync}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      source.status === "connected"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        source.status === "connected" ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    />
                    {source.status === "connected" ? "Connected & Fresh" : "Connection Error"}
                  </span>
                  <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal for adding connection */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-semibold text-slate-100">Connect Data Source</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                  &times;
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Connection Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Analytics Postgres DB"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Host / Connection String</label>
                  <input
                    type="text"
                    placeholder="postgresql://user:pass@db.example.com:5432/main"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium"
                >
                  Test & Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
