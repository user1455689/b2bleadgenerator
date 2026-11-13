"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Lead } from "@/types/lead";
import {
  Brain,
  Sparkles,
  ShieldCheck,
  Building2,
  ExternalLink,
  Search,
  ArrowRight,
  Play,
  CheckCircle2,
} from "lucide-react";

export default function ResearchReportsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const fetchResearchedLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads?limit=100");
      const data = await res.json();
      setLeads(data.leads || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearchedLeads();
  }, []);

  const handleBatchAnalyze = async () => {
    setBatchAnalyzing(true);
    try {
      // Analyze first 5 discovered leads
      const unresearched = leads.filter((l) => l.lead_score === 0).slice(0, 5);
      for (const u of unresearched) {
        await fetch("/api/intelligence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: u.id, forceRefresh: true }),
        });
      }
      fetchResearchedLeads();
    } finally {
      setBatchAnalyzing(false);
    }
  };

  const filtered = leads.filter(
    (l) =>
      l.company_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.industry.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.city.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex-1 pb-16">
      <AppHeader
        title="Agent 2: Deep AI Intelligence & Research Reports"
        subtitle="Operational scale, software migration signals, verified facts, and Accknown ERP qualification"
        actions={
          <button
            onClick={handleBatchAnalyze}
            disabled={batchAnalyzing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors"
          >
            <Brain className={`h-3.5 w-3.5 ${batchAnalyzing ? "animate-spin" : ""}`} />
            <span>{batchAnalyzing ? "Analyzing Batch..." : "Batch Research Discovered Leads"}</span>
          </button>
        }
      />

      <main className="px-8 py-6 space-y-6 max-w-7xl">
        {/* Search bar */}
        <div className="flex gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search research reports by company, sector, city..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filtered.length} Intelligence Dossiers
          </span>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 py-12 text-center text-xs text-slate-400">
              Loading intelligence reports...
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-xs text-slate-400">
              No matching research reports found.
            </div>
          ) : (
            filtered.map((lead) => {
              const res = lead.research;
              return (
                <div
                  key={lead.id}
                  className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-4 hover:border-brand-300 dark:hover:border-brand-800 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/50">
                        {lead.industry}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">
                        {lead.company_name}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {lead.city}, {lead.district} • Discovered via {lead.source_name}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                          lead.lead_score >= 75
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                            : lead.lead_score >= 60
                            ? "bg-blue-50 text-blue-700 border border-blue-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {lead.lead_score > 0 ? `${lead.lead_score}/100` : "Pending"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {res?.executive_summary || lead.business_description || "Commercial trading business in Nepal."}
                  </p>

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-1.5 text-[11px] pt-1">
                    {res?.icp_profile ? (
                      <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-bold border border-brand-200/50">
                        {res.icp_profile.icp_tier} ({res.icp_profile.icp_fit_score}%)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium">
                        Scale: {res?.estimated_scale || "SME Enterprise"}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium">
                      Staff: {res?.estimated_employees || "12-30 staff"}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium">
                      {res?.verified_facts ? `${res.verified_facts.length} Verified Facts` : "1 Fact"}
                    </span>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {lead.public_phone || "No phone listed"}
                    </span>

                    <Link
                      href={`/leads/${lead.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                    >
                      <span>Open Dossier</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

