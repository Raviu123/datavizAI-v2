'use client';

import React, { useState } from 'react';
import { Sparkles, Check, Plus, AlertCircle, BarChart2, Layers } from 'lucide-react';
import { CHART_REGISTRY } from '@/components/charts/registry';

export interface ChartCandidate {
  id: string;
  title: string;
  description: string;
  chart_type: string;
  category?: string;
  suitability_score?: number;
  recommended?: boolean;
  config: Record<string, any>;
}

interface ChartCandidatePickerModalProps {
  candidates: ChartCandidate[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmSelection: (selectedIds: string[], customCharts: any[]) => void;
  isLoading: boolean;
}

export const ChartCandidatePickerModal: React.FC<ChartCandidatePickerModalProps> = ({
  candidates,
  isOpen,
  onClose,
  onConfirmSelection,
  isLoading,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    candidates.filter((c) => c.recommended).map((c) => c.id)
  );

  // Custom Chart Builder state
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customChartType, setCustomChartType] = useState('bar');
  const [customXAxis, setCustomXAxis] = useState('');
  const [customYAxis, setCustomYAxis] = useState('');
  const [customAggregation, setCustomAggregation] = useState('SUM');
  const [customCharts, setCustomCharts] = useState<any[]>([]);

  if (!isOpen) return null;

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddCustomChart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customXAxis || !customYAxis) return;

    const newChart = {
      id: `custom_${Date.now()}`,
      title: customTitle,
      description: `User Custom ${customChartType.toUpperCase()} Chart (${customXAxis} vs ${customYAxis})`,
      chart_type: customChartType,
      category: 'custom',
      config: {
        xAxisKey: customXAxis,
        yAxisKeys: [customYAxis],
        aggregation: customAggregation,
        colorPalette: ['#6366f1', '#10b981', '#f59e0b'],
      },
    };

    setCustomCharts((prev) => [...prev, newChart]);
    setCustomTitle('');
    setCustomXAxis('');
    setCustomYAxis('');
    setShowCustomBuilder(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-slate-100">AI Suggested Visualizations</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select which doable charts you would like to generate or build a custom chart combo.
            </p>
          </div>
          <button
            onClick={() => setShowCustomBuilder(!showCustomBuilder)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Combo Chart</span>
          </button>
        </div>

        {/* Custom Builder Form Slide-Down */}
        {showCustomBuilder && (
          <form onSubmit={handleAddCustomChart} className="p-5 bg-indigo-950/40 border-b border-slate-800 space-y-4">
            <h3 className="text-xs font-semibold text-indigo-200 uppercase tracking-wide">Build Custom Visualization</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Chart Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sales vs Region"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Chart Type</label>
                <select
                  value={customChartType}
                  onChange={(e) => setCustomChartType(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {Object.entries(CHART_REGISTRY).map(([k, v]) => (
                    <option key={k} value={k}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">X-Axis / Category</label>
                <input
                  type="text"
                  placeholder="Column Name"
                  value={customXAxis}
                  onChange={(e) => setCustomXAxis(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Y-Axis Metric</label>
                <input
                  type="text"
                  placeholder="Metric Column"
                  value={customYAxis}
                  onChange={(e) => setCustomYAxis(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomBuilder(false)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow"
              >
                Add to Selection
              </button>
            </div>
          </form>
        )}

        {/* Candidate Cards Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((cand) => {
            const isSelected = selectedIds.includes(cand.id);

            return (
              <div
                key={cand.id}
                onClick={() => toggleSelection(cand.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-950/30 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-100">{cand.title}</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase border border-slate-700 shrink-0">
                      {cand.chart_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{cand.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">
                    Suitability: <strong className="text-indigo-300">{Math.round((cand.suitability_score || 0.9) * 100)}%</strong>
                  </span>
                  {cand.recommended && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      AI Recommended
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* User Added Custom Charts */}
          {customCharts.map((cc) => (
            <div
              key={cc.id}
              className="p-4 rounded-xl border bg-purple-950/20 border-purple-500/40 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-purple-200">{cc.title}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 uppercase border border-purple-700">
                    {cc.chart_type}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{cc.description}</p>
              </div>
              <div className="mt-3 text-[10px] text-purple-400 font-mono">Custom Combo</div>
            </div>
          ))}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Selected <strong className="text-indigo-400">{selectedIds.length + customCharts.length}</strong> visualizations to render
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirmSelection(selectedIds, customCharts)}
              disabled={isLoading || (selectedIds.length === 0 && customCharts.length === 0)}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all"
            >
              {isLoading ? (
                <span>Generating Charts...</span>
              ) : (
                <>
                  <BarChart2 className="w-4 h-4" />
                  <span>Generate Selected ({selectedIds.length + customCharts.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
