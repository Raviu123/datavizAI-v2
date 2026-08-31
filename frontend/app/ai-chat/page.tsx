"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ChartEngine } from "@/components/charts/ChartEngine";
import { datasetApi } from "@/lib/api-client";
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
    if (!input.trim() || !selectedDatasetId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentPrompt = input;
    setInput("");
    setIsTyping(true);

    try {
      const res = await datasetApi.chatWithData(selectedDatasetId, currentPrompt, conversationId);
      if (res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: res.message || "Query executed successfully against dataset.",
        sql: res.sql,
        visualization: res.visualization,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      const errReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: err.response?.data?.detail || "Failed to process chat query with data.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errReply]);
    } finally {
      setIsTyping(false);
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
                  <p className="text-xs leading-relaxed">{msg.text}</p>

                  {msg.sql && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <Code2 className="w-3 h-3 text-indigo-400" /> Auto-Generated DuckDB SQL:
                      </div>
                      <pre className="bg-slate-950 p-2.5 rounded text-[11px] font-mono text-indigo-300 border border-slate-800 overflow-x-auto">
                        {msg.sql}
                      </pre>
                    </div>
                  )}

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

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-indigo-300 font-mono animate-pulse bg-slate-900/60 p-3 rounded-xl border border-slate-800 w-fit">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              DuckDB SQL Engine analyzing dataset & generating response...
            </div>
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
