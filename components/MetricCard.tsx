import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: "brand" | "emerald" | "amber" | "blue" | "rose";
}

export function MetricCard({
  title,
  value,
  subValue,
  change,
  isPositive = true,
  icon: Icon,
  accentColor = "brand",
}: MetricCardProps) {
  const colorMap = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 border-l-brand-500",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-l-emerald-500",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-l-amber-500",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-l-blue-500",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-l-rose-500",
  };

  return (
    <div
      className={`p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm border-l-4 ${colorMap[accentColor]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</span>
        {change && (
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              isPositive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
            }`}
          >
            {change}
          </span>
        )}
      </div>

      {subValue && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">{subValue}</p>
      )}
    </div>
  );
}

