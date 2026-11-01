"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ChartEngine } from "@/components/charts/ChartEngine";
import { datasetApi } from "@/lib/api-client";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { CollapsibleQueryDetails } from "@/components/shared/CollapsibleQueryDetails";
import { ThinkingProcessDisclosure, ThinkingStep } from "@/components/shared/ThinkingProcessDisclosure";
import {
  MessageSquare,
  Sparkles,
  Send,
  Database,
  Code2,
  BarChart2,
  Bot,
  User,
  Zap,
  FileSpreadsheet,
  Loader2,
  AlertCircle
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  sql?: string;
  visualization?: any;
  timestamp: string;
  thinkingSteps?: ThinkingStep[];
  isStreaming?: boolean;
}

export default function AIChatPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [conversationId, setConversationId] = useState<string | undefined>();

  // Fetch uploaded datasets on page load
  useEffect(() => {
    async function loadDatasets() {
      try {
        const res = await datasetApi.listDatasets();
        const list = res.datasets || [];
        setDatasets(list);
        if (list.length > 0) {
          setSelectedDatasetId(list[0].id);
        }
      } catch (err) {
        console.error("Error listing datasets:", err);
      } finally {
        setIsLoadingDatasets(false);
      }
    }
    loadDatasets();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedDatasetId || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const aiMsgId = (Date.now() + 1).toString();
    const initialAiMsg: Message = {
      id: aiMsgId,
      sender: "ai",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      thinkingSteps: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAiMsg]);
    const currentPrompt = input;
    setInput("");
    setIsTyping(true);

    try {
      await datasetApi.streamChatWithData(
        selectedDatasetId,
        currentPrompt,
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
                      text: finalAnswer || "Analysis complete.",
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
                      text: event.error || event.message || "Failed to process chat query with data.",
                      isStreaming: false,
                    }
                  : msg
              )
            );
          }
        }
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: err.response?.data?.detail || err.message || "Failed to process chat query with data.",
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

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col justify-between space-y-4">
        {/* Header */}
        <div className="border-b border-slate-800/60 pb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">Chat with Data AI Agent</h1>
              <p className="text-xs text-slate-400">Natural language analytical queries converted into DuckDB SQL + Dynamic Charts</p>
            </div>
          </div>

          {/* Dataset Selector */}
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400 shrink-0" />
            {isLoadingDatasets ? (
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading datasets...
              </div>
            ) : datasets.length > 0 ? (
              <select
                value={selectedDatasetId}
                onChange={(e) => {
                  setSelectedDatasetId(e.target.value);
                  setMessages([]);
                  setConversationId(undefined);
                }}
                className="text-xs bg-slate-900 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.total_rows?.toLocaleString() ?? 0} rows)
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                No active dataset uploaded
              </span>
            )}
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
              <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400 mb-3">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Start Asking Questions About Your Dataset</h3>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Type questions like &ldquo;What are the top 5 revenue categories?&rdquo; or &ldquo;Show total sales over time&rdquo; to execute DuckDB queries and generate interactive charts.
              </p>
              {selectedDataset && (
                <div className="mt-4 text-[11px] font-mono text-indigo-400 bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-500/30">
                  Target Dataset: {selectedDataset.name} &bull; {selectedDataset.total_rows} rows &bull; {selectedDataset.total_columns} cols
                </div>
              )}
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.sender === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-indigo-400 border border-slate-700"
                  }`}
                >
                  {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-2xl rounded-xl p-4 space-y-3 ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-xl"
                  }`}
                >
                  {msg.sender === 'ai' && msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                    <ThinkingProcessDisclosure
                      steps={msg.thinkingSteps}
                      isStreaming={msg.isStreaming}
                    />
                  )}

                  {msg.text && <MarkdownRenderer content={msg.text} />}

                  {msg.isStreaming && !msg.text && (!msg.thinkingSteps || msg.thinkingSteps.length === 0) && (
                    <div className="flex items-center gap-2 text-xs text-indigo-300 font-mono py-1">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      DuckDB SQL Agent analyzing dataset...
                    </div>
                  )}

                  <CollapsibleQueryDetails
                    sql={msg.sql}
                    chartDataCount={msg.visualization?.data?.length}
                  />

                  {msg.visualization && msg.visualization.data && msg.visualization.data.length > 0 && (
                    <div className="pt-3 border-t border-slate-800">
                      <div className="text-[11px] text-indigo-300 mb-2 font-medium flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Interactive Visual Result:</span>
                      </div>
                      <div className="w-full">
                        <ChartEngine
                          strategy={{
                            id: `chat_vis_${msg.id}`,
                            title: msg.visualization.title || "Query Result",
                            description: "",
                            chart_type: msg.visualization.chart_type || "bar",
                            config: msg.visualization.config || {},
                            data: msg.visualization.data || [],
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 text-right">{msg.timestamp}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 shadow-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!selectedDatasetId || isTyping}
            placeholder={selectedDatasetId ? "Ask anything about your data in natural language..." : "Upload a dataset to enable chat..."}
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!selectedDatasetId || !input.trim() || isTyping}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 shrink-0"
          >
            <Send className="w-3.5 h-3.5" /> Send Query
          </button>
        </form>
      </div>
    </AppShell>
  );
}
