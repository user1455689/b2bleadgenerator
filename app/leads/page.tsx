"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Lead } from "@/types/lead";
import { TARGET_INDUSTRIES, NEPAL_LOCATIONS } from "@/lib/nepal-market-data";
import {
  Database,
  Search,
  Download,
  Filter,
  Brain,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Send,
  Sparkles,
  Phone,
  Mail,
} from "lucide-react";

export default function LeadDatabasePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("all");
  const [city, setCity] = useState("all");
  const [status, setStatus] = useState("all");
  const [minScore, setMinScore] = useState(0);

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (search) params.set("search", search);
      if (industry !== "all") params.set("industry", industry);
      if (city !== "all") params.set("city", city);
      if (status !== "all") params.set("status", status);
      if (minScore > 0) params.set("minScore", String(minScore));

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, industry, city, status, minScore]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (industry !== "all") params.set("industry", industry);
    if (city !== "all") params.set("city", city);
    if (status !== "all") params.set("status", status);
    if (minScore > 0) params.set("minScore", String(minScore));

    window.open(`/api/leads/export?${params.toString()}`, "_blank");
  };

  const handleRunAnalysis = async (leadId: string) => {
    setAnalyzingId(leadId);
    try {
      const res = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, forceRefresh: true }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
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
      setAnalyzingId(null);
    }
  };

  return (
    <div className="flex-1 pb-16">
      <AppHeader
        title="B2B Lead Directory & Intelligence Repository"
        subtitle="Search, filter, research and export high-conversion Nepal enterprise prospects"
        actions={
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        }
      />

      <main className="px-8 py-6 space-y-6 max-w-7xl">
        {/* Search & Filter Toolbar */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by company name, contact, phone, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 h-10 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filter Chips Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-900 text-xs">
            {/* Industry Filter */}
            <select
              value={industry}
              onChange={(e) => {
                setIndustry(e.target.value);
                setPage(1);
              }}
              className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium outline-none"
            >
              <option value="all">All Industries</option>
              {TARGET_INDUSTRIES.map((ind) => (
                <option key={ind.id} value={ind.name}>
                  {ind.name}
                </option>
              ))}
            </select>

            {/* City Filter */}
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(1);
              }}
              className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium outline-none"
            >
              <option value="all">All Regional Hubs</option>
              {NEPAL_LOCATIONS.map((loc) => (
                <option key={loc.city} value={loc.city}>
                  {loc.city} ({loc.district})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium outline-none"
            >
              <option value="all">All Pipeline Stages</option>
              <option value="discovered">Discovered</option>
              <option value="researched">Researched</option>
              <option value="qualified">Qualified</option>
              <option value="unqualified">Unqualified</option>
              <option value="outreach_drafted">Outreach Drafted</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
            </select>

            {/* Min Score Filter */}
            <select
              value={minScore}
              onChange={(e) => {
                setMinScore(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium outline-none"
            >
              <option value={0}>Any Lead Score</option>
              <option value={50}>Score ≥ 50 (SME Fit)</option>
              <option value={60}>Score ≥ 60 (Qualified)</option>
              <option value={75}>Score ≥ 75 (High Potential Tier-1)</option>
              <option value={85}>Score ≥ 85 (Urgent ICP Fit)</option>
            </select>
          </div>
        </div>

        {/* Leads Table Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {total} Total Prospects Listed
            </span>
            <span className="text-xs text-slate-400">
              Showing page {page} of {Math.max(1, Math.ceil(total / 15))}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-900 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Company & Domain</th>
                  <th className="py-3.5 px-4">Industry Vertical</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Score</th>
                  <th className="py-3.5 px-4 text-center">Pipeline</th>
                  <th className="py-3.5 px-4">Contact Lines</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                      Loading lead database records...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No matching leads found. Run discovery from the{" "}
                      <Link href="/discover" className="text-brand-600 font-semibold underline">
                        Discover Leads
                      </Link>{" "}
                      page.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      {/* Company Name & Domain */}
                      <td className="py-3.5 px-6">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-bold text-slate-900 dark:text-white hover:text-brand-600 transition-colors block"
                        >
                          {lead.company_name}
                        </Link>
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 font-mono mt-0.5"
                          >
                            <span>{lead.domain || lead.website}</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400">Public registry entry</span>
                        )}
                      </td>

                      {/* Industry */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                          {lead.industry}
                        </span>
                        {lead.icp_tier && (
                          <div className="mt-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/50">
                              {lead.icp_tier.replace("Tier 1: ", "T1: ").replace("Tier 2: ", "T2: ")}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* City */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{lead.city}</span>
                        <p className="text-[10px] text-slate-400">{lead.district}</p>
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4 text-center">
                        {lead.lead_score > 0 ? (
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${
                              lead.lead_score >= 75
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"
                                : lead.lead_score >= 60
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-900"
                            }`}
                          >
                            {lead.lead_score}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Pipeline Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            lead.pipeline_status === "qualified"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : lead.pipeline_status === "converted"
                              ? "bg-emerald-600 text-white"
                              : lead.pipeline_status === "outreach_drafted"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                          }`}
                        >
                          {lead.pipeline_status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Contacts */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {lead.public_phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-emerald-500" />
                              <span>{lead.public_phone}</span>
                            </div>
                          )}
                          {lead.public_email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-blue-500" />
                              <span className="truncate max-w-[140px]">{lead.public_email}</span>
                            </div>
                          )}
                          {!lead.public_phone && !lead.public_email && (
                            <span className="text-[10px] text-slate-400">Street address listed</span>
                          )}
                        </div>
                      </td>

                      {/* Action Links */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRunAnalysis(lead.id)}
                            disabled={analyzingId === lead.id}
                            title="Run Gemini Intelligence Analysis"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors"
                          >
                            <Brain className={`h-4 w-4 ${analyzingId === lead.id ? "animate-spin text-brand-600" : ""}`} />
                          </button>

                          <Link
                            href={`/leads/${lead.id}`}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/50"
                          >
                            Dossier
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {Math.max(1, Math.ceil(total / 15))}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 15 >= total}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

