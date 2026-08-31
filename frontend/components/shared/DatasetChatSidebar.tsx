'use client';

import React, { useState } from 'react';
import { ChartEngine } from '@/components/charts/ChartEngine';
import { datasetApi } from '@/lib/api-client';
import {
  MessageSquare,
  Sparkles,
  Send,
  Code2,
  BarChart2,
  Bot,
  User,
  Loader2,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';

interface DatasetChatSidebarProps {
  datasetId: string;
  datasetName: string;
  isOpen: boolean;
  onToggle: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sql?: string;
  visualization?: any;
  timestamp: string;
}

export const DatasetChatSidebar: React.FC<DatasetChatSidebarProps> = ({
  datasetId,
  datasetName,
  isOpen,
  onToggle,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const promptText = input;
    setInput('');
    setIsTyping(true);

    try {
      const res = await datasetApi.chatWithData(datasetId, promptText, conversationId);
      if (res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.message || 'Query processed.',
        sql: res.sql,
        visualization: res.visualization,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: err.response?.data?.detail || 'Error executing query.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errReply]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-6 bottom-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-2xl shadow-indigo-500/40 transition-all transform hover:scale-105"
      >
        <MessageSquare className="w-4 h-4 text-cyan-200" />
        <span>Chat with Data</span>
      </button>
    );
  }

  return (
    <div className="fixed right-4 top-20 bottom-6 z-40 w-96 bg-slate-900 border border-slate-800 flex flex-col rounded-2xl shadow-2xl overflow-hidden font-sans">
      {/* Sidebar Header */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100">Ask AI about {datasetName}</h3>
            <p className="text-[10px] text-slate-400">Natural language to DuckDB SQL</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-4 min-h-0">
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
                className={`max-w-[85%] rounded-xl p-3 space-y-2 text-xs ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <p className="leading-relaxed">{msg.text}</p>

                {msg.sql && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                      <Code2 className="w-2.5 h-2.5 text-indigo-400" /> SQL:
                    </div>
                    <pre className="bg-slate-900 p-1.5 rounded text-[10px] font-mono text-indigo-300 border border-slate-800 overflow-x-auto">
                      {msg.sql}
                    </pre>
                  </div>
                )}

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

        {isTyping && (
          <div className="flex items-center gap-2 text-[11px] text-indigo-300 font-mono animate-pulse bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            Analyzing dataset...
          </div>
        )}
      </div>

      {/* Input Form Fixed at Bottom */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
