"use client";

import Link from "next/link";
import { Compass, Sparkles, MapPin, Zap } from "lucide-react";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AppHeader({ title, subtitle, actions }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Google Maps Live
          </span>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
        {actions}
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white shadow-sm shadow-brand-500/25 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <Compass className="h-4 w-4" />
          <span>Launch Harvest</span>
        </Link>
      </div>
    </header>
  );
}
