"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  Settings,
  User,
  Key,
  Database,
  Bell,
  CheckCircle2,
  Shield,
} from "lucide-react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("sk-antigravity-ai-mock-key-8912");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800/60 pb-4">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" />
            Workspace & AI Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your AI provider keys, DuckDB execution memory, and workspace configurations.
          </p>
        </div>

        {/* AI Key Config Section */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Key className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-200">AI Model Provider Configuration</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Default LLM Engine</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500">
                <option>Gemini 2.5 Pro / Flash (Google DeepMind)</option>
                <option>Anthropic Claude 3.5 Sonnet</option>
                <option>OpenAI GPT-4o</option>
                <option>Local Ollama / Llama 3</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">API Secret Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* DuckDB In-Memory Engine Config */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-200">DuckDB Engine & Memory Settings</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Max Memory Allocation</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500">
                <option>4 GB (Default)</option>
                <option>8 GB</option>
                <option>16 GB</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Vector Threads</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500">
                <option>4 Worker Threads</option>
                <option>8 Worker Threads</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Settings saved successfully
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition-all shadow-md shadow-indigo-600/20"
          >
            Save Changes
          </button>
        </div>
      </div>
    </AppShell>
  );
}
