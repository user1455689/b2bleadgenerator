import React from "react";
import { ScoreBreakdown } from "@/types/lead";

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdown;
  compact?: boolean;
}

export function ScoreBreakdownRadar({ breakdown, compact = false }: ScoreBreakdownProps) {
  const dimensions = [
    {
      key: "industry_relevance",
      label: "Industry Relevance",
      score: breakdown.industry_relevance,
      max: 25,
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      key: "business_scale",
      label: "Business Scale",
      score: breakdown.business_scale,
      max: 20,
      color: "bg-indigo-500",
      textColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      key: "inventory_complexity",
      label: "Inventory Complexity",
      score: breakdown.inventory_complexity,
      max: 20,
      color: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "accounting_requirements",
      label: "Accounting / IRD Needs",
      score: breakdown.accounting_requirements,
      max: 15,
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    {
      key: "contact_availability",
      label: "Contact Reachability",
      score: breakdown.contact_availability,
      max: 10,
      color: "bg-purple-500",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      key: "buying_intent",
      label: "Buying Intent Signals",
      score: breakdown.buying_intent,
      max: 10,
      color: "bg-rose-500",
      textColor: "text-rose-600 dark:text-rose-400",
    },
  ];

  if (compact) {
    return (
      <div className="space-y-2">
        {dimensions.map((dim) => {
          const pct = Math.round((dim.score / dim.max) * 100);
          return (
            <div key={dim.key} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-400">{dim.label}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {dim.score}/{dim.max}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${dim.color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-6">
      {/* Header with Total Score Pill */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">6-Dimensional Qualification Score</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Algorithmic fit evaluation against Accknown ERP architecture
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {breakdown.total}
            </span>
            <span className="text-xs text-slate-400 font-medium">/100</span>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
              breakdown.total >= 75
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"
                : breakdown.total >= 60
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300"
                : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            {breakdown.total >= 75 ? "High Potential" : breakdown.total >= 60 ? "Qualified" : "Low Alignment"}
          </span>
        </div>
      </div>

      {/* Grid of Dimension Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dimensions.map((dim) => {
          const pct = Math.round((dim.score / dim.max) * 100);
          const rationaleText = breakdown.rationale?.[dim.key];

          return (
            <div
              key={dim.key}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 space-y-2"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{dim.label}</span>
                <span className={`font-mono font-bold ${dim.textColor}`}>
                  {dim.score} / {dim.max} pts
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${dim.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {rationaleText && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {rationaleText}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

