'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import {
  ArrowLeft,
  Sparkles,
  Plus,
  BarChart3
} from 'lucide-react';

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
                Interactive Dashboard Canvas
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic visual canvas powered by backend OpenRouter AI visualization engine.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/datasets"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Select Ingested Dataset
            </Link>
          </div>
        </div>

        {/* Dashboard Workspace */}
        <div className="p-16 border-2 border-dashed border-slate-800 rounded-xl text-center bg-slate-900/30 flex flex-col items-center justify-center">
          <BarChart3 className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-base font-semibold text-slate-200">No Active Dashboard Canvas Widgets</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            To view interactive charts, go to your datasets, select an uploaded file, and click &quot;Run OpenRouter AI Analysis&quot;.
          </p>
          <Link
            href="/datasets"
            className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Go to Datasets
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
