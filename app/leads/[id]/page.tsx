"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ScoreBreakdownRadar } from "@/components/ScoreBreakdownRadar";
import { ApprovalModal } from "@/components/ApprovalModal";
import { Lead, LeadOutreach } from "@/types/lead";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Brain,
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Layers,
  ShieldCheck,
  Calendar,
  Clock,
  Target,
} from "lucide-react";

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [activeModalDraft, setActiveModalDraft] = useState<LeadOutreach | null>(null);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads?search=${leadId}`);
      // Also fetch single via leadId search
      const data = await res.json();
      const found = (data.leads || []).find((l: Lead) => l.id === leadId) || data.leads?.[0];
      setLead(found || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, forceRefresh: true }),
      });
      const data = await res.json();
      if (data.success) {
        setLead((prev) =>
          prev
            ? {
                ...prev,
                lead_score: data.score,
                pipeline_status: data.score >= 60 ? "qualified" : "unqualified",
                research: data.research,
              }
            : null
        );
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateOutreach = async (lang: "en" | "np") => {
    setDrafting(true);
    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          channel: "email",
          language: lang,
          tone: "consultative",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveModalDraft(data.draft);
        fetchLead();
      }
    } finally {
      setDrafting(false);
    }
  };

  const handleApproveOutreach = async (outreachId: string, reviewer?: string) => {
    await fetch("/api/outreach", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outreachId, action: "approve", reviewer }),
    });
    fetchLead();
  };

  const handleRejectOutreach = async (outreachId: string, reason: string) => {
    await fetch("/api/outreach", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outreachId, action: "reject", reason }),
    });
    fetchLead();
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 text-center text-slate-400 font-medium">
        Loading 360° prospect dossier...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex-1 p-8 text-center space-y-3">
        <p className="text-slate-600 font-medium">Lead entity not found.</p>
        <Link href="/leads" className="text-brand-600 text-xs font-semibold underline">
          Return to database
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-16">
      <AppHeader
        title={lead.company_name}
        subtitle={`${lead.industry} • ${lead.city}, ${lead.district}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenerateOutreach("en")}
              disabled={drafting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{drafting ? "Drafting..." : "Draft Outreach (EN)"}</span>
            </button>
            <button
              onClick={() => handleGenerateOutreach("np")}
              disabled={drafting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/50 hover:bg-brand-100 transition-colors flex items-center gap-1.5"
            >
              <span>ड्राफ्ट पत्र (NP)</span>
            </button>
          </div>
        }
      />

      <main className="px-8 py-6 space-y-6 max-w-7xl">
        {/* Back Link */}
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Lead Directory</span>
        </Link>

        {/* Top Entity Summary Card */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/50">
                  {lead.industry}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {lead.verification_status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                {lead.company_name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {lead.business_description || "Commercial establishment operating in Nepal."}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-900">
              <div className="text-right">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {lead.lead_score}
                </span>
                <span className="text-xs text-slate-400 font-medium">/100</span>
                <p className="text-[10px] font-bold uppercase text-slate-400">Accknown Fit</p>
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="p-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors"
                title="Re-run Gemini Intelligence"
              >
                <Brain className={`h-4 w-4 ${analyzing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-900 text-xs">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Location & Address</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{lead.business_address || `${lead.city}, ${lead.district}`}</span>
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Commercial Phone</span>
              <p className="font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>{lead.public_phone || "Not listed"}</span>
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Email & Domain</span>
              <p className="font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span className="truncate">{lead.public_email || lead.domain || "Not listed"}</span>
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Source Attribution</span>
              <a
                href={lead.source_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span className="truncate">{lead.source_name}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          </div>
        </div>

        {/* AI ICP (Ideal Customer Profile) Dossier */}
        {lead.research?.icp_profile && (
          <div className="p-6 rounded-2xl border border-brand-200 dark:border-brand-900/60 bg-gradient-to-br from-brand-50/40 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-brand-950/20 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-brand-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-500/20">
                  <Target className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      AI Ideal Customer Profile (ICP) Analysis
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300 border border-brand-200">
                      {lead.research.icp_profile.icp_tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lead.research.icp_profile.target_icp_category}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400">ICP Fit Score: </span>
                <span className="text-sm font-black text-brand-600 font-mono">
                  {lead.research.icp_profile.icp_fit_score}% Match
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Recommended Accknown Package</span>
                <p className="font-bold text-brand-700 dark:text-brand-300">
                  {lead.research.icp_profile.recommended_package}
                </p>
                <p className="text-[11px] text-slate-500">
                  <strong>Urgency:</strong> {lead.research.icp_profile.erp_urgency_level}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Decision-Maker Personas</span>
                <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 text-[11px] space-y-0.5">
                  {lead.research.icp_profile.decision_maker_personas.map((persona, idx) => (
                    <li key={idx} className="truncate">{persona}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Primary Objections & Handling</span>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 text-[11px] space-y-0.5">
                  {lead.research.icp_profile.primary_objections_to_anticipate.slice(0, 2).map((obj, idx) => (
                    <li key={idx} className="line-clamp-1">{obj}</li>
                  ))}
                </ul>
              </div>
            </div>

            {lead.research.icp_profile.key_characteristics && (
              <div className="pt-2 text-xs space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">
                  Core Operational Characteristics & ICP Fit Signals:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {lead.research.icp_profile.key_characteristics.map((charac, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium"
                    >
                      ✓ {charac}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6-Dimensional Score Breakdown */}
        {lead.research?.score_breakdown && (
          <ScoreBreakdownRadar breakdown={lead.research.score_breakdown} />
        )}

        {/* Verified Facts vs AI Assumptions (Mandated by Section 1 & Section 7) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Verified Facts */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Verified Facts</h3>
                <p className="text-[11px] text-slate-400">Directly confirmed from public web indices & registries</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {lead.research?.verified_facts && lead.research.verified_facts.length > 0 ? (
                lead.research.verified_facts.map((vf, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs text-slate-800 dark:text-slate-200 space-y-1"
                  >
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300">{vf.fact}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Source: {vf.source}</span>
                      <span className="font-mono text-emerald-600 font-bold">{vf.confidence}% Verified</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center">
                  Click &quot;Analyze Lead&quot; to synthesize verified facts.
                </div>
              )}
            </div>
          </div>

          {/* AI Assumptions */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <Brain className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI-Generated Assumptions</h3>
                <p className="text-[11px] text-slate-400">Operational reality inferred by Gemini 1.5 market models</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {lead.research?.ai_assumptions && lead.research.ai_assumptions.length > 0 ? (
                lead.research.ai_assumptions.map((ass, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs text-slate-800 dark:text-slate-200 space-y-1"
                  >
                    <div className="flex items-start justify-between">
                      <p className="font-semibold text-indigo-950 dark:text-indigo-300">{ass.assumption}</p>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        {ass.likelihood}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      <strong>Rationale:</strong> {ass.rationale}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center">
                  Assumptions will appear following AI intelligence analysis.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Accknown ERP Modules */}
        {lead.research?.recommended_features && lead.research.recommended_features.length > 0 && (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                <Layers className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Targeted Accknown ERP Value Propositions
                </h3>
                <p className="text-xs text-slate-400">
                  Feature recommendations tailored to this prospect&apos;s exact bottlenecks
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {lead.research.recommended_features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-700 dark:text-brand-300">{feat.module_name}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      High ROI
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong>Bottleneck Solved:</strong> {feat.pain_point_solved}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    <strong>Sales Pitch Angle:</strong> {feat.pitch_angle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Human Approval Modal */}
      <ApprovalModal
        draft={activeModalDraft}
        isOpen={!!activeModalDraft}
        onClose={() => setActiveModalDraft(null)}
        onApprove={handleApproveOutreach}
        onReject={handleRejectOutreach}
      />
    </div>
  );
}

