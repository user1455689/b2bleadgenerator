"use client";

import Link from "next/link";
import { Compass, Sparkles, ShieldCheck } from "lucide-react";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AppHeader({ title, subtitle, actions }: AppHeaderProps) {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur sticky top-0 z-20 px-8 flex items-center justify-between">
      <div>
        <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors"
        >
          <Compass className="h-3.5 w-3.5" />
          <span>Quick Harvest</span>
        </Link>
      </div>
    </header>
  );
}

