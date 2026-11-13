"use client";

import { useState } from "react";
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
  Menu,
  X,
  Sparkles,
  ArrowUpRight,
  Zap,
  Radio,
  Search,
} from "lucide-react";

const NAVIGATION_ITEMS = [
  { name: "Executive Overview", href: "/", icon: LayoutDashboard, badge: null },
  { name: "Discover Leads", href: "/discover", icon: Compass, badge: "Google Maps" },
  { name: "Lead Database", href: "/leads", icon: Database, badge: null },
  { name: "AI Research", href: "/research", icon: Brain, badge: null },
  { name: "Sales Pipeline", href: "/pipeline", icon: Kanban, badge: null },
  { name: "Outreach Hub", href: "/outreach", icon: Send, badge: "HITL" },
  { name: "Agent Config", href: "/config", icon: Sliders, badge: null },
  { name: "Automation & Cron", href: "/automation", icon: Settings, badge: null },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const renderNavLinks = () => (
    <div className="space-y-1">
      {NAVIGATION_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/25"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-900/70"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400"
                }`}
              />
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200/50 dark:border-brand-800/50"
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* ── MOBILE TOP NAVIGATION BAR (Visible < lg) ────────────────── */}
      <div className="lg:hidden sticky top-0 z-40 h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
              A
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">Accknown</span>
              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200/60">
                Lead AI
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
        >
          <Compass className="h-3.5 w-3.5" />
          <span>Harvest</span>
        </Link>
      </div>

      {/* ── MOBILE BACKDROP OVERLAY ──────────────────────────────────── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* ── MOBILE SIDEBAR DRAWER ────────────────────────────────────── */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
              A
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Accknown</div>
              <div className="text-[10px] text-slate-400">B2B Growth Engine</div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 py-4 overflow-y-auto">{renderNavLinks()}</div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-900 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Scraper Status</span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live (Google Maps)
            </span>
          </div>
          <a
            href="https://accknown.com"
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex items-center justify-between text-[11px] font-semibold text-brand-600 hover:underline"
          >
            <span>accknown.com ERP</span>
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* ── DESKTOP FIXED SIDEBAR (Visible >= lg) ─────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl h-screen fixed left-0 top-0 z-30">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-900">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-brand-500/20">
              A
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">Accknown</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200/50">
                  Growth
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">B2B Lead Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 py-4 px-3.5 space-y-4 overflow-y-auto">
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Navigation
            </div>
            {renderNavLinks()}
          </div>
        </div>

        {/* Live Engine Status Footbar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
                Cluster Operational
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Nepal Hubs & Google Maps scraper active
            </p>
          </div>

          <a
            href="https://accknown.com"
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-between px-1 text-[11px] text-brand-600 hover:text-brand-700 dark:text-brand-400 font-semibold transition-colors"
          >
            <span>Open accknown.com ERP</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </aside>

      {/* ── MAIN CONTENT CONTAINER (Responsive lg:pl-64) ─────────────── */}
      <div className="flex-1 lg:pl-64 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}

