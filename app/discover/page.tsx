"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { TARGET_INDUSTRIES, NEPAL_LOCATIONS } from "@/lib/nepal-market-data";
import { Lead } from "@/types/lead";
import {
  Compass,
  Play,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Brain,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function DiscoverPage() {
  const [selectedIndustry, setSelectedIndustry] = useState(TARGET_INDUSTRIES[0].name);
  const [selectedLocation, setSelectedLocation] = useState(NEPAL_LOCATIONS[0].city);
  const [targetCount, setTargetCount] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<Lead[]>([]);
  const [metrics, setMetrics] = useState<{ discovered: number; duplicatesSkipped: number } | null>(null);
  const [analyzingLeadId, setAnalyzingLeadId] = useState<string | null>(null);

  const handleLaunchHarvest = async () => {
    setIsRunning(true);
    setMetrics(null);
    try {
      const res = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: selectedIndustry,
          location: selectedLocation,
          targetCount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDiscoveredLeads(data.leads || []);
        setMetrics(data.metrics);
      } else {
        alert(data.error || "Discovery failed");
      }
    } catch (e: any) {
      alert(e?.message || "Failed to execute discovery");
    } finally {
      setIsRunning(false);
    }
  };

  const handleAnalyzeSingle = async (leadId: string) => {
    setAnalyzingLeadId(leadId);
    try {
      const res = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, forceRefresh: true }),
      });
      const data = await res.json();
      if (data.success) {
        setDiscoveredLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  lead_score: data.score,
                  pipeline_status: data.score >= 60 ? "qualified" : "unqualified",
                }
              : l
          )
        );
      }
    } finally {
      setAnalyzingLeadId(null);
    }
  };

  return (
    <div className="flex-1 pb-16">
      <AppHeader
        title="Agent 1: Autonomous Lead Discovery"
        subtitle="Harvest prospective FMCG, manufacturing, retail, and wholesale companies across Nepal"
      />

      <main className="px-8 py-6 space-y-6 max-w-7xl">
        {/* Configuration Card */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="h-4 w-4 text-brand-600" />
                <span>Discovery Parameters</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target high-fit commercial sectors and regional trade corridors in Nepal
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Industry Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Industry Vertical
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {TARGET_INDUSTRIES.map((ind) => (
                  <option key={ind.id} value={ind.name}>
                    {ind.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Regional City / Trade Hub
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {NEPAL_LOCATIONS.map((loc) => (
                  <option key={loc.city} value={loc.city}>
                    {loc.city} ({loc.district} District)
                  </option>
                ))}
              </select>
            </div>

            {/* Target Leads Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Number of Leads to Harvest
              </label>
              <select
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value={5}>5 Leads (Fast preview)</option>
                <option value={10}>10 Leads (Standard batch)</option>
                <option value={20}>20 Leads (Full regional sweep)</option>
                <option value={50}>50 Leads (Deep market harvest)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              * Automatically enforces domain & phone deduplication against existing database and suppression list.
            </span>
            <button
              onClick={handleLaunchHarvest}
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Compass className="h-4 w-4 animate-spin" />
                  <span>Harvesting Public Indices...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" />
                  <span>Run Autonomous Harvest</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Banner */}
        {metrics && (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>
                <strong>Harvest Run Complete:</strong> Successfully captured <strong>{metrics.discovered}</strong> new leads. Skipped <strong>{metrics.duplicatesSkipped}</strong> duplicates.
              </span>
            </div>
            <Link href="/leads" className="font-semibold underline flex items-center gap-1">
              <span>View in Master Database</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Live Discovered Leads Stream */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Captured Prospective Entities ({discoveredLeads.length})
            </h3>
            {discoveredLeads.length > 0 && (
              <span className="text-xs text-slate-400">Source URLs verified & stored</span>
            )}
          </div>

          {discoveredLeads.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 space-y-3">
              <Compass className="h-8 w-8 mx-auto text-slate-400" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Ready to initiate lead discovery
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Select your target sector and trade location above, then click &quot;Run Autonomous Harvest&quot; to begin capturing leads with phone, address, and source attribution.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discoveredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-4 hover:border-brand-300 dark:hover:border-brand-800 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/50">
                        {lead.industry}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                        {lead.company_name}
                      </h4>
                    </div>

                    <div className="text-right">
                      {lead.lead_score > 0 ? (
                        <span className="font-black text-sm text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {lead.lead_score} pts
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">
                          Not Researched
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {lead.business_description}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-900">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{lead.business_address || `${lead.city}, ${lead.district}`}</span>
                    </div>

                    {lead.public_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="font-mono text-[11px]">{lead.public_phone}</span>
                      </div>
                    )}

                    {lead.public_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="font-mono text-[11px]">{lead.public_email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-900">
                    <a
                      href={lead.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
                    >
                      <span>Source: {lead.source_name}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAnalyzeSingle(lead.id)}
                        disabled={analyzingLeadId === lead.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300 transition-colors"
                      >
                        <Brain className={`h-3 w-3 ${analyzingLeadId === lead.id ? "animate-spin" : ""}`} />
                        <span>{analyzingLeadId === lead.id ? "Analyzing..." : "Analyze Lead"}</span>
                      </button>

                      <Link
                        href={`/leads/${lead.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

