"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ApprovalModal } from "@/components/ApprovalModal";
import { LeadOutreach } from "@/types/lead";
import {
  Send,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Edit3,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function OutreachManagementPage() {
  const [drafts, setDrafts] = useState<LeadOutreach[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<LeadOutreach | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/outreach");
      const data = await res.json();
      setDrafts(data.drafts || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleApprove = async (outreachId: string, reviewer?: string) => {
    await fetch("/api/outreach", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outreachId, action: "approve", reviewer }),
    });
    fetchDrafts();
  };

  const handleReject = async (outreachId: string, reason: string) => {
    await fetch("/api/outreach", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outreachId, action: "reject", reason }),
    });
    fetchDrafts();
  };

  const filtered = drafts.filter((d) => statusFilter === "all" || d.approval_status === statusFilter);

  return (
    <div className="flex-1 pb-16">
      <AppHeader
        title="Agent 3: Cold Outreach & Human Governance Hub"
        subtitle="Review, customize, and authorize cold email and WhatsApp messaging drafts"
      />

      <main className="px-8 py-6 space-y-6 max-w-7xl">
        {/* Governance Mandate Callout */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 dark:bg-amber-950/40 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Human-in-the-Loop Policy Enforced</h4>
            <p>
              In strict accordance with B2B compliance rules, Agent 3 never transmits emails or messages automatically. All outreach drafts require explicit human review and authorization before external dispatch.
            </p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs">
          {[
            { id: "all", label: `All Messages (${drafts.length})` },
            { id: "pending_approval", label: `Pending Approval (${drafts.filter((d) => d.approval_status === "pending_approval").length})` },
            { id: "approved", label: `Approved (${drafts.filter((d) => d.approval_status === "approved").length})` },
            { id: "rejected", label: `Rejected (${drafts.filter((d) => d.approval_status === "rejected").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drafts Listing */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading outreach drafts...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              No outreach messages found under this filter. Go to any lead in the{" "}
              <a href="/leads" className="text-brand-600 font-semibold underline">
                Lead Database
              </a>{" "}
              to generate tailored drafts.
            </div>
          ) : (
            filtered.map((draft) => (
              <div
                key={draft.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      {draft.channel === "email" ? (
                        <Mail className="h-4 w-4" />
                      ) : draft.channel === "whatsapp" ? (
                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Phone className="h-4 w-4 text-blue-500" />
                      )}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {draft.subject_line || `${draft.channel.toUpperCase()} Outreach Draft`}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Language: <strong className="uppercase">{draft.language}</strong> • Campaign: {draft.campaign_name}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      draft.approval_status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                        : draft.approval_status === "rejected"
                        ? "bg-rose-50 text-rose-700 border border-rose-300"
                        : "bg-amber-50 text-amber-700 border border-amber-300"
                    }`}
                  >
                    {draft.approval_status.replace("_", " ")}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 font-sans text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                  {draft.body_text}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-900">
                  <div className="flex items-center gap-2">
                    {draft.key_selling_points?.map((pt, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {pt}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedDraft(draft)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Review & Authorize</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Human Approval Review Modal */}
      <ApprovalModal
        draft={selectedDraft}
        isOpen={!!selectedDraft}
        onClose={() => setSelectedDraft(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}

