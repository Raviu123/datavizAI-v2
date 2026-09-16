import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  Link2,
  Compass,
  MessageSquare,
  BarChart3,
  Settings,
  Sparkles,
  ChevronRight,
  Plus,
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Live Dashboards", href: "/data-sources", icon: Link2 },
  { name: "Datasets", href: "/datasets", icon: Database },
  { name: "Explore & Query", href: "/explore", icon: Compass },
  { name: "Dashboards", href: "/dashboards", icon: BarChart3 },
  { name: "AI Assistant", href: "/ai-chat", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 antialiased overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-950/90 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-white">DataViz AI</span>
              <span className="text-[10px] text-slate-400 font-mono">Workspace v1.0</span>
            </div>
          </Link>
        </div>

        {/* Quick action button */}
        <div className="p-3">
          <Link
            href="/datasets?action=upload"
            className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            New Dataset / Source
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3 h-3 text-indigo-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Active Workspace / User Context */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950">
          <div className="flex items-center gap-3 p-2 rounded-lg border border-slate-800/60 bg-slate-900/40">
            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-semibold text-xs text-indigo-400 border border-slate-700">
              US
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-medium text-slate-200 truncate">Enterprise Workspace</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Engine Active
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        {/* Top Workspace Bar */}
        <header className="h-13 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-950/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400">Workspace</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-semibold text-slate-200 capitalize">
              {pathname === "/" ? "Home" : pathname.split("/")[1] || "Overview"}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>DuckDB In-Memory Engine</span>
            </div>
            <div className="text-slate-400">
              Data Freshness: <span className="text-slate-200 font-medium">Just now</span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
