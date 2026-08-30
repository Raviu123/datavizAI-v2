"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
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
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  sql?: string;
  chartData?: any[];
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "msg-1",
    sender: "user",
    text: "Why did revenue drop slightly in April?",
    timestamp: "10:42 AM",
  },
  {
    id: "msg-2",
    sender: "ai",
    text: "Revenue contracted by 5.6% in April primarily due to a seasonal decrease in mid-market self-serve renewals. Enterprise tier expansion remained positive at +4.2%.",
    sql: `SELECT segment, SUM(mrr) as segment_mrr 
FROM sales_transactions 
WHERE month = 'Apr' 
GROUP BY segment;`,
    chartData: [
      { segment: "Enterprise", segment_mrr: 50000 },
      { segment: "Self-Serve", segment_mrr: 68000 },
    ],
    timestamp: "10:42 AM",
  },
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: `Analysis complete for "${input}". High confidence correlation detected with Q3 retention metrics.`,
        sql: `SELECT region, COUNT(id) FROM active_users GROUP BY region ORDER BY 2 DESC;`,
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, aiReply]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col justify-between space-y-4">
        {/* Header */}
        <div className="border-b border-slate-800/60 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">AI Data Assistant</h1>
              <p className="text-xs text-slate-400">Contextual natural language analysis on active datasets</p>
            </div>
          </div>
          <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            DuckDB SQL Agent Active
          </span>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {messages.map((msg) => (
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
                    : "bg-slate-900/80 border border-slate-800/80 text-slate-200 rounded-tl-none"
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

                {msg.chartData && (
                  <div className="pt-3 border-t border-slate-800">
                    <div className="text-[11px] text-slate-400 mb-2 font-medium">Supporting Visualization:</div>
                    <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={msg.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                          <XAxis dataKey="segment" stroke="#94a3b8" fontSize={10} />
                          <YAxis stroke="#94a3b8" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "6px", fontSize: "11px" }} />
                          <Bar dataKey="segment_mrr" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                <div className="text-[10px] text-slate-400 text-right">{msg.timestamp}</div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono animate-pulse">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              AI is analyzing dataset and writing DuckDB SQL query...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 shadow-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your data in natural language..."
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 shrink-0"
          >
            <Send className="w-3.5 h-3.5" /> Send Query
          </button>
        </form>
      </div>
    </AppShell>
  );
}
