'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ChartEngine } from '@/components/charts/ChartEngine';
import { ChartCandidatePickerModal } from '@/components/shared/ChartCandidatePickerModal';
import { liveDataSourceApi } from '@/lib/api-client';
import {
  Database,
  Plus,
  Server,
  CheckCircle2,
  Radio,
  Sparkles,
  RefreshCw,
  Zap,
  Activity,
  Play,
  Pause,
  AlertCircle,
  Loader2,
  ShoppingBag
} from 'lucide-react';

export default function DataSourcesPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [activeSource, setActiveSource] = useState<any>(null);
  
  // Connect Form State
  const [sourceName, setSourceName] = useState('Shopify Live Webhook Simulator');
  const [sourceUrl, setSourceUrl] = useState('http://localhost:8000/api/v1/mock/shopify/live-orders');
  const [refreshInterval, setRefreshInterval] = useState(3);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Candidate Modal & Live Feed State
  const [pendingCandidates, setPendingCandidates] = useState<any[]>([]);
  const [pendingSourceId, setPendingSourceId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Live Stream Feed State
  const [isStreaming, setIsStreaming] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState<any>({});
  const [liveVisualizations, setLiveVisualizations] = useState<any[]>([]);
  const [lastTickTime, setLastTickTime] = useState<string>('');

  const handleConnectSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim() || !sourceName.trim()) return;

    setIsConnecting(true);
    setErrorMsg(null);
    try {
      const res = await liveDataSourceApi.connectLiveSourceUrl(sourceName, sourceUrl, refreshInterval);
      setPendingSourceId(res.source_id);
      setPendingCandidates(res.candidates || []);
      setIsModalOpen(true);
      
      const newSource = {
        id: res.source_id,
        name: res.name,
        source_url: res.source_url,
        refresh_interval_seconds: refreshInterval,
        dataset_summary: res.dataset_summary,
        status: 'connected',
      };
      setSources((prev) => [...prev, newSource]);
      setActiveSource(newSource);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to connect Live Source URL.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConfirmApproval = async (selectedCandidateIds: string[]) => {
    if (!pendingSourceId) return;
    setIsApproving(true);
    try {
      await liveDataSourceApi.approveCandidates(pendingSourceId, selectedCandidateIds);
      setIsModalOpen(false);
      // Immediately trigger initial live feed poll
      pollFeed(pendingSourceId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to approve live candidates.');
    } finally {
      setIsApproving(false);
    }
  };

  const pollFeed = async (sourceId: string) => {
    try {
      const data = await liveDataSourceApi.pollLiveDataFeed(sourceId);
      setLiveMetrics(data.live_metrics || {});
      setLiveVisualizations(data.visualizations || []);
      setLastTickTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error polling live stream:', err);
    }
  };

  // Live interval polling effect
  useEffect(() => {
    let timer: any = null;
    if (activeSource && isStreaming) {
      pollFeed(activeSource.id);
      timer = setInterval(() => {
        pollFeed(activeSource.id);
      }, (activeSource.refresh_interval_seconds || 3) * 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeSource, isStreaming]);

  const handleUseMockShopifyPreset = () => {
    setSourceName('Shopify Real-Time Store Feed');
    setSourceUrl('http://localhost:8000/api/v1/mock/shopify/live-orders');
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8 pb-16">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-6 h-6 text-indigo-400" />
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Live Data Sources & Real-Time Dashboards</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> Live Stream Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Connect external REST/Stream API endpoints (e.g. Shopify Webhook, Weather, Market APIs). AI analyzes live payload, plans visualizations, and streams real-time updates.
            </p>
          </div>
        </div>

        {/* Connect Live Source Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-100">Connect New Live API Data Source</h2>
            </div>
            <button
              onClick={handleUseMockShopifyPreset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
              <span>Use Shopify Live Preset</span>
            </button>
          </div>

          <form onSubmit={handleConnectSource} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Source Name</label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="e.g. Shopify Live Orders"
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Live Endpoint URL</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="http://localhost:8000/api/v1/mock/shopify/live-orders"
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={isConnecting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 text-cyan-200 animate-spin" />
                    <span>Analyzing Stream...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>Connect & Plan Charts</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Real-Time Live Dashboard View */}
        {activeSource && (
          <div className="space-y-6">
            {/* Live Status Toolbar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500 relative" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-100">{activeSource.name}</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Polling every {activeSource.refresh_interval_seconds}s
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{activeSource.source_url}</p>
                </div>
              </div>

              {/* Streaming Toggles */}
              <div className="flex items-center gap-3">
                {lastTickTime && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    Last Tick: <strong className="text-cyan-400">{lastTickTime}</strong>
                  </span>
                )}

                <button
                  onClick={() => setIsStreaming(!isStreaming)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    isStreaming
                      ? 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-900/50'
                      : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/50'
                  }`}
                >
                  {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
                </button>
              </div>
            </div>

            {/* Live KPI Metric Cards */}
            {liveMetrics && Object.keys(liveMetrics).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Live Revenue</span>
                    <h3 className="text-2xl font-extrabold text-slate-100 mt-1">
                      ${Number(liveMetrics.total_revenue || 0).toLocaleString()}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Avg Order Value</span>
                    <h3 className="text-2xl font-extrabold text-slate-100 mt-1">
                      ${Number(liveMetrics.avg_order_value || 0).toFixed(2)}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Active Checkout Rate</span>
                    <h3 className="text-2xl font-extrabold text-slate-100 mt-1">
                      {liveMetrics.active_checkout_rate || 24} / min
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Dynamic Charts Grid */}
            {liveVisualizations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {liveVisualizations.map((chart) => (
                  <ChartEngine key={chart.id} strategy={chart} />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <p className="text-xs">No approved live visualizations attached yet.</p>
              </div>
            )}
          </div>
        )}

        {/* AI Candidate Approval Modal */}
        <ChartCandidatePickerModal
          candidates={pendingCandidates}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirmSelection={(ids) => handleConfirmApproval(ids)}
          isLoading={isApproving}
        />
      </div>
    </AppShell>
  );
}
