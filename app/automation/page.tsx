"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DiscoveryJob, SuppressionEntry } from "@/types/lead";
import { TARGET_INDUSTRIES, NEPAL_LOCATIONS } from "@/lib/nepal-market-data";
import {
  Settings,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Play,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  Zap,
  Database,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { B2B_MIGRATION_SQL } from "@/lib/migration-sql";

export default function AutomationSettingsPage() {
  const [jobs, setJobs] = useState<DiscoveryJob[]>([]);
  const [suppressionList, setSuppressionList] = useState<SuppressionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbHealth, setDbHealth] = useState<{ connected: boolean; tableExists: boolean; error?: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // New suppression form
  const [newType, setNewType] = useState<"domain" | "email" | "phone" | "company_name">("domain");
  const [newValue, setNewValue] = useState("");
  const [newReason, setNewReason] = useState("competitor");

  // Scheduled configuration
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [frequency, setFrequency] = useState("daily");
  const [dailyQuota, setDailyQuota] = useState(50);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jRes, sRes] = await Promise.all([
        fetch("/api/discovery"),
        fetch("/api/suppression"),
      ]);
      const jData = await jRes.json();
      const sData = await sRes.json();
      setJobs(jData.jobs || []);
      setSuppressionList(sData.suppressionList || []);
      if (jData.dbHealth) {
        setDbHealth(jData.dbHealth);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    await fetch("/api/suppression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier_type: newType,
        identifier_value: newValue.trim(),
        reason: newReason,
      }),
    });

    setNewValue("");
    fetchData();
  };

  return (
    <div className="flex-1 pb-16">
      <AppHeader
        title="Autonomous Scheduling, Rate Limiting & Compliance"
        subtitle="Configure background cron jobs, execution quotas, error policies, and suppression registries"
      />

      <main className="px-8 py-6 space-y-6 max-w-5xl">
        {/* Supabase Schema Provisioning Alert */}
        {dbHealth && !dbHealth.tableExists && (
          <div className="p-5 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 mt-0.5">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Supabase Database Tables Not Initialized</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                    Your Supabase project (<code className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded text-[11px] font-mono">hyjfnwyfptjwwfbitlqv</code>) is connected, but the <code className="font-mono font-semibold">b2b_discovery_jobs</code> &amp; <code className="font-mono font-semibold">b2b_suppression_list</code> tables have not been created yet in PostgreSQL.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="https://supabase.com/dashboard/project/hyjfnwyfptjwwfbitlqv/sql/new"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Supabase SQL Editor</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(B2B_MIGRATION_SQL);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 3000);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-amber-900/40 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">SQL Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Migration SQL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        {/* Scheduler Settings Card */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-600" />
                <span>Scheduled Background Harvester</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically triggers Agent 1 & Agent 2 during low-traffic overnight hours in Nepal
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={(e) => setScheduleEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Execution Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-medium"
              >
                <option value="daily">Nightly (02:00 NPT)</option>
                <option value="twice_weekly">Twice Weekly (Sun & Wed)</option>
                <option value="weekly">Weekly (Sundays)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Daily Leads Quota Limit</label>
              <input
                type="number"
                value={dailyQuota}
                onChange={(e) => setDailyQuota(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Retry & Error Policy</label>
              <div className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-slate-600">
                <span>Exponential Backoff</span>
                <span className="font-bold text-emerald-600">3x</span>
              </div>
            </div>
          </div>
        </div>

        {/* Suppression & Opt-Out Management (Section 7) */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-5">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <span>Suppression & Opt-Out Registry (Anti-Spam & Compliance)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Entities, competitor domains, or opt-out contacts in this list are unconditionally blocked from automated outreach and duplicate ingestion.
            </p>
          </div>

          {/* Add Entry Form */}
          <form onSubmit={handleAddSuppression} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <select
              value={newType}
              onChange={(e: any) => setNewType(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium"
            >
              <option value="domain">Domain</option>
              <option value="email">Email Address</option>
              <option value="phone">Phone Number</option>
              <option value="company_name">Company Name</option>
            </select>

            <input
              type="text"
              placeholder="e.g. competitor.com or +977-98..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            />

            <select
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium"
            >
              <option value="competitor">Competitor</option>
              <option value="existing_customer">Existing Customer</option>
              <option value="unsubscribed">Opted Out / Unsubscribed</option>
              <option value="do_not_contact">Do Not Contact (DNC)</option>
            </select>

            <button
              type="submit"
              className="h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add to Blocklist</span>
            </button>
          </form>

          {/* Suppression Table */}
          <div className="border border-slate-100 dark:border-slate-900 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-semibold text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-4">Identifier Type</th>
                  <th className="py-2.5 px-4">Suppressed Value</th>
                  <th className="py-2.5 px-4">Reason</th>
                  <th className="py-2.5 px-4 text-right">Added Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {suppressionList.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono uppercase text-slate-500 text-[11px]">
                      {sup.identifier_type}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                      {sup.identifier_value}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-700">
                        {sup.reason.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {sup.created_at.slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Execution Log History */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Historical Job Execution Logs
          </h3>

          <div className="space-y-2">
            {jobs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No background jobs executed yet.</p>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{job.job_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                        {job.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Targeted {job.target_industry} in {job.target_location} • Duration: {job.execution_duration_sec}s
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {job.leads_found} Leads Added
                    </span>
                    <p className="text-[11px] text-slate-400">{job.duplicates_skipped} duplicates skipped</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

