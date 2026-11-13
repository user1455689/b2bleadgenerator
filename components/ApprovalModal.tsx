"use client";

import React, { useState } from "react";
import { LeadOutreach } from "@/types/lead";
import { CheckCircle2, XCircle, Copy, Check, Send, Edit3, ShieldAlert } from "lucide-react";

interface ApprovalModalProps {
  draft: LeadOutreach | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (outreachId: string, reviewer?: string) => Promise<void>;
  onReject: (outreachId: string, reason: string) => Promise<void>;
}

export function ApprovalModal({
  draft,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: ApprovalModalProps) {
  const [copied, setCopied] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState("");

  if (!isOpen || !draft) return null;

  const currentBody = isEditing ? editedBody : draft.body_text;

  const handleCopy = () => {
    const fullText = draft.subject_line
      ? `Subject: ${draft.subject_line}\n\n${currentBody}`
      : currentBody;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(draft.id, "Superadmin Officer");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      setShowRejectInput(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await onReject(draft.id, rejectReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200/50">
                <ShieldAlert className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Human-in-the-Loop Outreach Authorization
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Agent 3 generated a targeted message draft. Strict policy requires human review before external communication.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>

        {/* Channel & Campaign metadata */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium">
            Channel: <strong className="uppercase">{draft.channel}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium">
            Language: <strong className="uppercase">{draft.language}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 font-semibold border border-brand-200/50">
            {draft.approval_status.replace("_", " ").toUpperCase()}
          </span>
        </div>

        {/* Email Subject Line (if present) */}
        {draft.subject_line && (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Subject Line
            </span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {draft.subject_line}
            </p>
          </div>
        )}

        {/* Message Body Draft */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Personalized Draft Message
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!isEditing) setEditedBody(draft.body_text);
                  setIsEditing(!isEditing);
                }}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
              >
                <Edit3 className="h-3 w-3" />
                {isEditing ? "View Preview" : "Edit Copy"}
              </button>
              <button
                onClick={handleCopy}
                className="text-xs text-slate-600 hover:text-slate-800 dark:text-slate-400 font-medium flex items-center gap-1"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {isEditing ? (
            <textarea
              rows={9}
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-brand-300 bg-white dark:bg-slate-900 font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 font-sans text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {currentBody}
            </div>
          )}
        </div>

        {/* Key Selling Points Highlight */}
        {draft.key_selling_points && draft.key_selling_points.length > 0 && (
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Targeted Value Points
            </span>
            <div className="flex flex-wrap gap-1.5">
              {draft.key_selling_points.map((pt, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50"
                >
                  ✓ {pt}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reject reason input */}
        {showRejectInput && (
          <div className="space-y-1.5 animate-in fade-in">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Feedback / Rejection Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Tone too formal, needs more emphasis on van sales..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-rose-300 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:ring-1 focus:ring-rose-500 outline-none"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-900">
          <button
            onClick={handleReject}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            <span>{showRejectInput ? "Confirm Rejection" : "Reject Draft"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? "Authorizing..." : "Authorize & Mark Approved"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

