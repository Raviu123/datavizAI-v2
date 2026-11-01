'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChartEngine } from '@/components/charts/ChartEngine';
import { datasetApi } from '@/lib/api-client';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { CollapsibleQueryDetails } from '@/components/shared/CollapsibleQueryDetails';
import { ThinkingProcessDisclosure, ThinkingStep } from '@/components/shared/ThinkingProcessDisclosure';
import {
  MessageSquare,
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  GripVertical,
  PanelRightClose,
  BarChart2,
  X
} from 'lucide-react';

interface DatasetChatSidebarProps {
  datasetId: string;
  datasetName: string;
  isOpen: boolean;
  onToggle: () => void;
  width?: number;
  onWidthChange?: (newWidth: number) => void;
  attachedChart?: any;
  onClearAttachedChart?: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sql?: string;
  visualization?: any;
  timestamp: string;
  thinkingSteps?: ThinkingStep[];
  isStreaming?: boolean;
  attachedChartInfo?: {
    title: string;
    chart_type: string;
  };
}

export const DatasetChatSidebar: React.FC<DatasetChatSidebarProps> = ({
  datasetId,
  datasetName,
  isOpen,
  onToggle,
  width = 380,
  onWidthChange,
  attachedChart,
  onClearAttachedChart,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [sidebarWidth, setSidebarWidth] = useState<number>(width);
  const [activeAttachedChart, setActiveAttachedChart] = useState<any>(attachedChart || null);

  useEffect(() => {
    if (attachedChart) {
      setActiveAttachedChart(attachedChart);
    }
  }, [attachedChart]);

  const handleClearAttachment = () => {
    setActiveAttachedChart(null);
    if (onClearAttachedChart) {
      onClearAttachedChart();
    }
  };

  const isResizing = useRef(false);

  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    isResizing.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = window.innerWidth - mouseMoveEvent.clientX - 32;
      const clampedWidth = Math.min(Math.max(newWidth, 280), 750);
      setSidebarWidth(clampedWidth);
      if (onWidthChange) {
        onWidthChange(clampedWidth);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const chartToSend = activeAttachedChart ? {
      id: activeAttachedChart.id,
      title: activeAttachedChart.title,
      chart_type: activeAttachedChart.chart_type,
      description: activeAttachedChart.description,
      xAxisKey: activeAttachedChart.config?.xAxisKey,
      yAxisKeys: activeAttachedChart.config?.yAxisKeys,
      data: activeAttachedChart.data || [],
    } : undefined;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedChartInfo: activeAttachedChart ? {
        title: activeAttachedChart.title,
        chart_type: activeAttachedChart.chart_type,
      } : undefined,
    };

    const aiMsgId = (Date.now() + 1).toString();
    const initialAiMsg: Message = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      thinkingSteps: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAiMsg]);
    const promptText = input;
    setInput('');
    setIsTyping(true);
    handleClearAttachment();

    try {
      await datasetApi.streamChatWithData(
        datasetId,
        promptText,
        conversationId,
        (event: any) => {
          const evtType = event.type || event.event;

          if ((evtType === 'init' || evtType === 'start') && event.conversation_id) {
            setConversationId(event.conversation_id);
          } else if (evtType === 'thought') {
            const thoughtText = event.thought || event.content || '';
            if (thoughtText) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId
                    ? {
                        ...msg,
                        thinkingSteps: [
                          ...(msg.thinkingSteps || []),
                          {
                            id: `${Date.now()}-${Math.random()}`,
                            type: 'thought',
                            step: event.cycle ?? event.step,
                            content: thoughtText,
                          },
                        ],
                      }
                    : msg
                )
              );
            }
          } else if (evtType === 'tool_call') {
            const tool = event.action || event.tool || 'execute_sql';
            const query = event.sql || event.query || (event.params ? JSON.stringify(event.params) : '');
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId
                  ? {
                      ...msg,
                      thinkingSteps: [
                        ...(msg.thinkingSteps || []),
                        {
                          id: `${Date.now()}-${Math.random()}`,
                          type: 'tool_call',
                          step: event.cycle ?? event.step,
                          tool,
                          query,
                        },
                      ],
                    }
                  : msg
              )
            );
          } else if (evtType === 'tool_result') {
            const tool = event.action || event.tool || 'execute_sql';
            const obs = event.observation || event.result;
            const sample = event.data || event.sample_values || (typeof obs === 'object' ? obs.sample : obs);
            const rowCount = event.row_count ?? (typeof obs === 'object' ? obs.row_count : (Array.isArray(sample) ? sample.length : undefined));

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId
                  ? {
                      ...msg,
                      thinkingSteps: [
                        ...(msg.thinkingSteps || []),
                        {
                          id: `${Date.now()}-${Math.random()}`,
                          type: 'tool_result',
                          step: event.cycle ?? event.step,
                          tool,
                          result: {
                            row_count: rowCount,
                            sample,
                            observation: typeof obs === 'string' ? obs : undefined,
                          },
                        },
                      ],
                    }
                  : msg
              )
            );
          } else if (evtType === 'final_answer') {
            const finalAnswer = event.message || event.answer || '';
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId
                  ? {
                      ...msg,
                      text: finalAnswer || 'Analysis complete.',
                      sql: event.sql,
                      visualization: event.visualization,
                      isStreaming: false,
                    }
                  : msg
              )
            );
          } else if (evtType === 'error') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId
                  ? {
                      ...msg,
                      text: event.error || event.message || 'Encountered an issue executing analysis.',
                      isStreaming: false,
                    }
                  : msg
              )
            );
          }
        },
        undefined,
        chartToSend
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: err.response?.data?.detail || err.message || 'Error executing query.',
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg))
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ width: `${sidebarWidth}px` }}
      className="relative flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-sans shrink-0 transition-all duration-75"
    >
      {/* Resizable Drag Handle Bar on Left Edge */}
      <div
        onMouseDown={startResizing}
        title="Drag left or right to adjust chat width"
        className="absolute left-0 top-0 bottom-0 w-3 z-30 cursor-col-resize group flex items-center justify-center hover:bg-indigo-500/20 active:bg-indigo-500/40 transition-colors"
      >
        <div className="w-1 h-12 rounded-full bg-slate-700/80 group-hover:bg-indigo-400 group-active:bg-indigo-300 transition-colors flex items-center justify-center">
          <GripVertical className="w-2.5 h-2.5 text-slate-400 group-hover:text-white" />
        </div>
      </div>

      {/* Sidebar Header */}
      <div className="p-3.5 pl-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h3 className="text-xs font-bold text-slate-100 truncate">Ask AI: {datasetName}</h3>
            <p className="text-[10px] text-slate-400">Natural language to DuckDB SQL</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggle}
            title="Close Assistant"
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <MessageSquare className="w-6 h-6 text-indigo-400 mb-2 opacity-60" />
            <p className="text-xs font-medium text-slate-300">Ask questions about this dataset</p>
            <p className="text-[11px] text-slate-500 mt-1">
              e.g. &ldquo;Show top 5 sales&rdquo; or &ldquo;What is the average value?&rdquo;
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-indigo-400 border border-slate-700'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              </div>

              <div
                className={`max-w-[88%] rounded-xl p-3 space-y-2 text-xs ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.sender === 'user' && msg.attachedChartInfo && (
                  <div className="flex items-center gap-1.5 text-[10px] bg-indigo-700/80 text-indigo-100 px-2 py-0.5 rounded-md mb-1 w-fit font-mono shadow-sm">
                    <BarChart2 className="w-3 h-3 text-indigo-200 shrink-0" />
                    <span>Attached: {msg.attachedChartInfo.title}</span>
                  </div>
                )}

                {msg.sender === 'ai' && msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                  <ThinkingProcessDisclosure
                    steps={msg.thinkingSteps}
                    isStreaming={msg.isStreaming}
                  />
                )}

                {msg.text && <MarkdownRenderer content={msg.text} />}

                {msg.isStreaming && !msg.text && (!msg.thinkingSteps || msg.thinkingSteps.length === 0) && (
                  <div className="flex items-center gap-2 text-[11px] text-indigo-300 font-mono py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    Thinking...
                  </div>
                )}

                <CollapsibleQueryDetails
                  sql={msg.sql}
                  chartDataCount={msg.visualization?.data?.length}
                />

                {msg.visualization && msg.visualization.data && msg.visualization.data.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-[10px] text-indigo-300 font-medium mb-1">Generated Chart:</div>
                    <ChartEngine
                      strategy={{
                        id: `sidebar_vis_${msg.id}`,
                        title: msg.visualization.title || 'Result',
                        description: '',
                        chart_type: msg.visualization.chart_type || 'bar',
                        config: msg.visualization.config || {},
                        data: msg.visualization.data || [],
                      }}
                    />
                  </div>
                )}

                <div className="text-[9px] text-slate-500 text-right">{msg.timestamp}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Attached Chart Context Pill & Quick Suggestions */}
      {activeAttachedChart && (
        <div className="px-3 pt-2.5 pb-1.5 bg-slate-950 border-t border-slate-800 space-y-2 shrink-0">
          <div className="flex items-center justify-between bg-indigo-950/70 border border-indigo-500/40 rounded-lg px-2.5 py-1.5 text-xs text-indigo-200 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded bg-indigo-500/20 text-indigo-300 shrink-0">
                <BarChart2 className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <span className="font-semibold text-slate-100 truncate block text-[11px]">
                  {activeAttachedChart.title}
                </span>
                <span className="text-[10px] text-indigo-300/80 font-mono">
                  {activeAttachedChart.chart_type?.toUpperCase()} • {activeAttachedChart.data?.length || 0} data points
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearAttachment}
              title="Remove attached chart"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-indigo-900/50 transition-colors shrink-0 ml-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Query Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px] no-scrollbar">
            <button
              type="button"
              onClick={() => setInput("Explain the key takeaways and performance trends shown in this chart.")}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-indigo-300 whitespace-nowrap transition-colors cursor-pointer"
            >
              💡 Explain takeaways
            </button>
            <button
              type="button"
              onClick={() => setInput("Why is the top-performing category leading by so much compared to the others?")}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-indigo-300 whitespace-nowrap transition-colors cursor-pointer"
            >
              🔍 Why is top leading?
            </button>
            <button
              type="button"
              onClick={() => setInput("What anomalies, risks, or unusual distributions exist in this chart?")}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-indigo-300 whitespace-nowrap transition-colors cursor-pointer"
            >
              ⚠️ Identify risks
            </button>
          </div>
        </div>
      )}

      {/* Input Form Fixed at Bottom */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your data..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors shrink-0 shadow-md shadow-indigo-600/20"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
