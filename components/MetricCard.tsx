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
  const styles = {
    brand: {
      border: "hover:border-brand-300 dark:hover:border-brand-700",
      iconBg: "bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400",
      dot: "bg-brand-500",
      gradient: "from-brand-500/10 via-transparent to-transparent",
    },
    emerald: {
      border: "hover:border-emerald-300 dark:hover:border-emerald-700",
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
      dot: "bg-emerald-500",
      gradient: "from-emerald-500/10 via-transparent to-transparent",
    },
    amber: {
      border: "hover:border-amber-300 dark:hover:border-amber-700",
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
      dot: "bg-amber-500",
      gradient: "from-amber-500/10 via-transparent to-transparent",
    },
    blue: {
      border: "hover:border-blue-300 dark:hover:border-blue-700",
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
      dot: "bg-blue-500",
      gradient: "from-blue-500/10 via-transparent to-transparent",
    },
    rose: {
      border: "hover:border-rose-300 dark:hover:border-rose-700",
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
      dot: "bg-rose-500",
      gradient: "from-rose-500/10 via-transparent to-transparent",
    },
  }[accentColor];

  return (
    <div
      className={`relative overflow-hidden p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${styles.border}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${styles.gradient}`} />

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${styles.iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {change && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isPositive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50"
            }`}
          >
            {change}
          </span>
        )}
      </div>

      {subValue && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
          {subValue}
        </p>
      )}
    </div>
  );
}
