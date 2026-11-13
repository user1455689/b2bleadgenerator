import { Lead, LeadResearch } from "../../types/lead";
import { leadStore } from "../supabase-admin";
import { runGeminiIntelligenceAnalysis } from "../gemini";

export class LeadIntelligenceAgent {
  /**
   * Run in-depth intelligence research and scoring for a lead
   */
  static async analyzeLead(leadId: string, forceRefresh = false): Promise<LeadResearch> {
    const lead = await leadStore.getLeadById(leadId);
    if (!lead) {
      throw new Error(`Lead with ID ${leadId} not found`);
    }

    // Check if research already exists
    if (lead.research && !forceRefresh) {
      return lead.research;
    }

    // Formulate contextual web signals from business description, address, and metadata
    const contextSnippets = [
      `Entity Name: ${lead.company_name}`,
      `Industry Vertical: ${lead.industry}`,
      `Location: ${lead.city}, District: ${lead.district}`,
      `Business Profile: ${lead.business_description || "Commercial trading business in Nepal"}`,
      `Official Source: ${lead.source_url} (${lead.source_name})`,
      `Contact Verified: ${lead.public_phone ? "Direct telephone listed" : "No direct phone"}`,
    ];

    // Execute Gemini analysis with structured fact/assumption separation & scoring
    const research = await runGeminiIntelligenceAnalysis(lead, contextSnippets);

    // Save research report and update lead pipeline status
    const saved = await leadStore.saveResearch(research);

    // Determine priority tier based on final score
    let priorityTier = lead.priority_tier;
    if (saved.score_breakdown.total >= 80) priorityTier = "tier_1_urgent";
    else if (saved.score_breakdown.total >= 65) priorityTier = "tier_2_high";
    else if (saved.score_breakdown.total >= 50) priorityTier = "tier_3_medium";
    else priorityTier = "tier_4_low";

    await leadStore.saveLead({
      ...lead,
      lead_score: saved.score_breakdown.total,
      priority_tier: priorityTier,
      icp_tier: saved.icp_profile?.icp_tier,
      icp_fit_score: saved.icp_profile?.icp_fit_score,
      pipeline_status: saved.score_breakdown.total >= 60 ? "qualified" : "unqualified",
      last_researched_at: new Date().toISOString(),
    });

    return saved;
  }

  /**
   * Batch analyze all newly discovered leads
   */
  static async batchAnalyzeUnresearched(limit = 10): Promise<{ processed: number; qualified: number }> {
    const { leads } = await leadStore.getLeads({ status: "discovered", limit });
    let qualified = 0;

    for (const lead of leads) {
      const research = await this.analyzeLead(lead.id);
      if (research.score_breakdown.total >= 60) {
        qualified++;
      }
    }

    return { processed: leads.length, qualified };
  }
}
