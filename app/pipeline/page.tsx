"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Lead, LeadStatus } from "@/types/lead";
import {
  Kanban,
  Building2,
  ArrowRight,
  MoveRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  Phone,
} from "lucide-react";

const PIPELINE_COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
  { id: "discovered", label: "Discovered", color: "border-t-slate-400" },
  { id: "researched", label: "Researched", color: "border-t-indigo-400" },
  { id: "qualified", label: "Qualified", color: "border-t-emerald-500" },
  { id: "outreach_drafted", label: "Outreach Ready", color: "border-t-amber-500" },
  { id: "contacted", label: "Contacted", color: "border-t-blue-500" },
  { id: "demo_scheduled", label: "Demo Booked", color: "border-t-purple-500" },
  { id: "converted", label: "Converted", color: "border-t-emerald-600" },
];

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads?limit=250");
      const data = await res.json();
      setLeads(data.leads || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleAdvanceStage = async (lead: Lead) => {
    const sequence: LeadStatus[] = [
      "discovered",
      "researched",
      "qualified",
      "outreach_drafted",
      "contacted",
      "demo_scheduled",
      "converted",
    ];
    const currentIndex = sequence.indexOf(lead.pipeline_status);
    if (currentIndex < sequence.length - 1) {
      const nextStatus = sequence[currentIndex + 1];
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, pipeline_status: nextStatus }),
      });
      fetchLeads();
    }
  };

  return (
    <div className="flex-1 pb-16">
      <AppHeader
        title="B2B Sales Pipeline & Deal Velocity"
        subtitle="Manage prospective client lifecycles from automated discovery through to ERP onboarding"
      />

      <main className="px-8 py-6 space-y-6 max-w-[1600px] overflow-x-auto">
        <div className="flex gap-4 min-w-[1200px] pb-6">
          {PIPELINE_COLUMNS.map((col) => {
            const columnLeads = leads.filter((l) => l.pipeline_status === col.id);

            return (
              <div
                key={col.id}
                className={`flex-1 min-w-[220px] bg-slate-100/60 dark:bg-slate-900/40 rounded-2xl p-3 space-y-3 border border-slate-200/60 dark:border-slate-800 border-t-4 ${col.color}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {col.label}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
                  {columnLeads.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400 bg-white/40 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      No leads in stage
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-brand-300 transition-all text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] font-bold uppercase text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                            {lead.industry.split(" ")[0]}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                            {lead.lead_score > 0 ? `${lead.lead_score} pts` : "—"}
                          </span>
                        </div>

                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-bold text-slate-900 dark:text-white hover:text-brand-600 block line-clamp-1"
                        >
                          {lead.company_name}
                        </Link>

                        <p className="text-[11px] text-slate-400">
                          {lead.city} • {lead.public_phone || "No phone"}
                        </p>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                          >
                            Details
                          </Link>

                          {col.id !== "converted" && (
                            <button
                              onClick={() => handleAdvanceStage(lead)}
                              title="Move to next stage"
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900 text-brand-600 font-medium flex items-center gap-0.5 text-[10px]"
                            >
                              <span>Next</span>
                              <MoveRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

