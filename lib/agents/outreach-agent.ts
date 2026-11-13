import { Lead, LeadOutreach } from "../../types/lead";
import { leadStore } from "../supabase-admin";
import { generatePersonalizedOutreach } from "../gemini";
import { LeadIntelligenceAgent } from "./intelligence-agent";

export interface OutreachGenerationOptions {
  leadId: string;
  channel?: "email" | "whatsapp" | "phone_script";
  language?: "en" | "np";
  tone?: "consultative" | "executive" | "direct";
  campaignName?: string;
}

export class SalesAssistantAgent {
  /**
   * Generates tailored sales outreach drafts (requires human approval before sending)
   */
  static async draftOutreach(options: OutreachGenerationOptions): Promise<LeadOutreach> {
    const lead = await leadStore.getLeadById(options.leadId);
    if (!lead) {
      throw new Error(`Lead with ID ${options.leadId} not found`);
    }

    // Ensure lead has research data
    let research = lead.research;
    if (!research) {
      research = await LeadIntelligenceAgent.analyzeLead(lead.id);
    }

    const channel = options.channel || "email";
    const language = options.language || "en";

    // Call Gemini Outreach synthesis
    const draft = await generatePersonalizedOutreach(lead, research, {
      channel,
      language,
      tone: options.tone || "consultative",
    });

    // Save with STRICT approval status: "pending_approval"
    const saved = await leadStore.saveOutreach({
      lead_id: lead.id,
      campaign_name: options.campaignName || "Direct GTM Prospecting",
      channel,
      subject_line: draft.subject_line,
      body_text: draft.body_text,
      key_selling_points: draft.key_selling_points,
      language,
      approval_status: "pending_approval",
    });

    // Update lead pipeline status to outreach_drafted if currently qualified
    if (lead.pipeline_status === "qualified" || lead.pipeline_status === "researched") {
      await leadStore.saveLead({
        ...lead,
        pipeline_status: "outreach_drafted",
      });
    }

    return saved;
  }

  /**
   * Authorize and approve a cold outreach draft (Human-in-the-Loop)
   */
  static async approveOutreach(outreachId: string, authorizer: string): Promise<LeadOutreach> {
    const updated = await leadStore.updateOutreachStatus(outreachId, "approved", authorizer);
    if (!updated) {
      throw new Error(`Outreach draft ${outreachId} not found`);
    }

    // Update lead pipeline to contacted or approved
    const lead = await leadStore.getLeadById(updated.lead_id);
    if (lead) {
      await leadStore.saveLead({
        ...lead,
        pipeline_status: "contacted",
      });
    }

    return updated;
  }

  /**
   * Reject outreach draft with feedback notes
   */
  static async rejectOutreach(outreachId: string, reason: string): Promise<LeadOutreach> {
    const updated = await leadStore.updateOutreachStatus(outreachId, "rejected", undefined, reason);
    if (!updated) {
      throw new Error(`Outreach draft ${outreachId} not found`);
    }
    return updated;
  }

  /**
   * Generate automated multi-touch follow-up sequence
   */
  static async generateFollowUp(
    outreachId: string,
    sequenceDay: 3 | 7
  ): Promise<{ subject: string; body: string }> {
    const existing = storeOutreachGet(outreachId);
    const company = existing?.lead_id ? (await leadStore.getLeadById(existing.lead_id))?.company_name || "your team" : "your team";

    if (sequenceDay === 3) {
      return {
        subject: `Quick follow-up regarding Accknown & ${company}`,
        body: `Hi there,\n\nJust following up on my previous note. We understand how hectic month-end billing and credit ledger closing can get in Nepal. Would it be helpful if I sent over a 2-minute video walkthrough of Accknown's automated IRD invoicing & stock ledger?\n\nBest regards,\nAccknown Growth Team`,
      };
    }

    return {
      subject: `Case study: How wholesale distributors in Nepal cut billing time by 70%`,
      body: `Hi there,\n\nSharing a quick update on how wholesale FMCG and hardware suppliers across Nepal have transitioned from desktop Tally to Accknown's real-time cloud ERP with zero downtime.\n\nWould you have 10 minutes next Tuesday to review their setup?\n\nBest regards,\nAccknown Growth Team`,
    };
  }
}

function storeOutreachGet(id: string): LeadOutreach | undefined {
  if (typeof global !== "undefined" && global.__superadmin_store) {
    return global.__superadmin_store.outreach.get(id);
  }
  return undefined;
}
