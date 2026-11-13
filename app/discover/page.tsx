"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { TARGET_INDUSTRIES, NEPAL_LOCATIONS } from "@/lib/nepal-market-data";
import { Lead } from "@/types/lead";
import { B2B_MIGRATION_SQL } from "@/lib/migration-sql";
import {
  Compass,
  Play,
  CheckCircle2,
  Building2,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Brain,
  Sparkles,
  ArrowRight,
  Globe,
  Radio,
  Map,
  Copy,
  Check,
  Database,
} from "lucide-react";
import Link from "next/link";

const POPULAR_HUBS = [
  { city: "Birgunj", district: "Parsa", tag: "Industrial Hub" },
  { city: "Kathmandu", district: "Kathmandu", tag: "HQ & Trading" },
  { city: "Pokhara", district: "Kaski", tag: "Hospitality & Retail" },
  { city: "Biratnagar", district: "Morang", tag: "Manufacturing" },
  { city: "Butwal", district: "Rupandehi", tag: "Commercial Corridor" },
  { city: "Narayangarh", district: "Chitwan", tag: "Agri & Wholesale" },
];

export default function DiscoverPage() {
  const [selectedIndustry, setSelectedIndustry] = useState(TARGET_INDUSTRIES[0].name);
  const [selectedLocation, setSelectedLocation] = useState(NEPAL_LOCATIONS[0].city);
  const [targetCount, setTargetCount] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<Lead[]>([]);
  const [metrics, setMetrics] = useState<{ discovered: number; duplicatesSkipped: number } | null>(null);
  const [analyzingLeadId, setAnalyzingLeadId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dbHealth, setDbHealth] = useState<{ connected: boolean; tableExists: boolean; error?: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    fetch("/api/discovery")
      .then((r) => r.json())
      .then((d) => {
        if (d.dbHealth) setDbHealth(d.dbHealth);
      })
      .catch(() => {});
  }, []);

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
      if (data.dbHealth) setDbHealth(data.dbHealth);
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="flex-1 pb-16">
      <AppHeader
        title="Live Lead Harvester"
        subtitle="Capture high-potential Nepalese businesses with verified Google Maps profiles & phone lines"
      />

      <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
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
                    Your Supabase project (<code className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded text-[11px] font-mono">meramyjzbdmjhegvspop</code>) is connected, but the <code className="font-mono font-semibold">b2b_leads</code> table does not exist in PostgreSQL. Harvested leads are currently retained only in temporary memory and will disappear upon reload.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="https://supabase.com/dashboard/project/meramyjzbdmjhegvspop/sql/new"
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
        {/* ── LIVE SCRAPING & AI BANNER ───────────────────────────────── */}
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-brand-900 via-indigo-950 to-slate-950 text-white shadow-lg border border-brand-800/40">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Live Scraping Engine Connected
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Google Maps Places + Gemini 1.5 Grounding
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Directly extracts registered businesses in Nepal with genuine physical street addresses, verified phone numbers, and Maps ratings—then enriches them for Accknown ERP sales qualification.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs">
                <div className="text-[10px] text-slate-300 font-semibold uppercase">Engine Strategy</div>
                <div className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <Map className="h-3.5 w-3.5 text-brand-300" />
                  <span>Google Places &rarr; Gemini</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONFIGURATION & DISCOVERY CONTROLS ──────────────────────── */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="h-4 w-4 text-brand-600" />
                <span>Harvest Configuration</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Filter by industry vertical and major industrial corridors
              </p>
            </div>

            {/* Quick Hub Pills */}
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_HUBS.map((hub) => (
                <button
                  key={hub.city}
                  onClick={() => setSelectedLocation(hub.city)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    selectedLocation === hub.city
                      ? "bg-brand-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {hub.city}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Industry Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Target Industry Vertical
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
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
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Target Regional Trade Hub
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
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
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Batch Size
              </label>
              <select
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value={5}>5 Leads (Fast preview)</option>
                <option value={10}>10 Leads (Standard batch)</option>
                <option value={20}>20 Leads (Deep market sweep)</option>
                <option value={50}>50 Leads (Enterprise corridor harvest)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium">
              * Automated deduplication against existing database by normalized name, PAN, and phone.
            </span>
            <button
              onClick={handleLaunchHarvest}
              disabled={isRunning}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shrink-0"
            >
              {isRunning ? (
                <>
                  <Compass className="h-4 w-4 animate-spin" />
                  <span>Harvesting Live Google Maps & AI...</span>
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

        {/* ── EXECUTION METRICS BANNER ─────────────────────────────────── */}
        {metrics && (
          <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Harvest Complete:</strong> Successfully captured <strong>{metrics.discovered}</strong> live entities. Skipped <strong>{metrics.duplicatesSkipped}</strong> existing duplicates.
              </span>
            </div>
            <Link
              href="/leads"
              className="font-bold underline flex items-center gap-1 hover:text-emerald-900 dark:hover:text-white"
            >
              <span>View Master Database</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* ── DISCOVERED ENTITIES STREAM ──────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Captured Prospective Entities</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {discoveredLeads.length}
              </span>
            </h3>
            {discoveredLeads.length > 0 && (
              <span className="text-xs text-slate-400 font-medium">100% verified source attribution</span>
            )}
          </div>

          {discoveredLeads.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 mx-auto flex items-center justify-center">
                <Compass className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Ready to initiate autonomous lead discovery
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Choose a sector and commercial hub (e.g., <strong>Birgunj</strong> or <strong>Kathmandu</strong>), then click &quot;Run Autonomous Harvest&quot; to fetch real businesses from Google Maps.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discoveredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 hover:border-brand-400 dark:hover:border-brand-700 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200/50">
                        {lead.industry}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {lead.company_name}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      {lead.lead_score > 0 ? (
                        <div className="text-right">
                          <span className="font-black text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-200/50">
                            {lead.lead_score} pts
                          </span>
                          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Qualified</div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          Pending AI
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {lead.business_description}
                  </p>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{lead.business_address || `${lead.city}, ${lead.district}`}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {lead.public_phone && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{lead.public_phone}</span>
                          <button
                            onClick={() => copyToClipboard(lead.public_phone!, lead.id)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Copy phone"
                          >
                            {copiedId === lead.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      )}

                      {lead.website && (
                        <a
                          href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                        >
                          <Globe className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{lead.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={lead.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-slate-500 hover:text-brand-600 flex items-center gap-1 font-semibold"
                    >
                      <span>{lead.source_name}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAnalyzeSingle(lead.id)}
                        disabled={analyzingLeadId === lead.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200/50 transition-all disabled:opacity-50"
                      >
                        <Brain className={`h-3.5 w-3.5 ${analyzingLeadId === lead.id ? "animate-spin text-brand-600" : ""}`} />
                        <span>{analyzingLeadId === lead.id ? "Analyzing..." : "AI Qualify"}</span>
                      </button>

                      <Link
                        href={`/leads/${lead.id}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                      >
                        360° View
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
