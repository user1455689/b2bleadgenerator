"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Database,
  Brain,
  Kanban,
  Send,
  Sliders,
  Settings,
  ShieldAlert,
  Zap,
  ArrowUpRight,
} from "lucide-react";

const NAVIGATION_ITEMS = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Discover Leads", href: "/discover", icon: Compass },
  { name: "Lead Database", href: "/leads", icon: Database },
  { name: "AI Research", href: "/research", icon: Brain },
  { name: "Sales Pipeline", href: "/pipeline", icon: Kanban },
  { name: "Outreach Hub", href: "/outreach", icon: Send },
  { name: "Agent Config", href: "/config", icon: Sliders },
  { name: "Automation & Cron", href: "/automation", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-900 gap-3">
        <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          A
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">Accknown</span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/50">
              Growth
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Superadmin Lead AI</p>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">
          Core Workflows
        </div>
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900/60"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* System Status Footbar */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-[11px] font-medium text-slate-500">3 AI Agents Active</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <p className="text-[11px] text-slate-400">Nepal B2B Harvester</p>
        <a
          href="https://accknown.com"
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center justify-between text-[11px] text-brand-600 hover:text-brand-700 font-medium pt-2 border-t border-slate-200/60 dark:border-slate-800"
        >
          <span>accknown.com ERP</span>
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </aside>
  );
}

