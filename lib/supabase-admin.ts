import { createClient } from "@supabase/supabase-js";
import {
  Lead,
  LeadResearch,
  LeadOutreach,
  DiscoveryJob,
  ScoringConfig,
  SuppressionEntry,
} from "../types/lead";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hyjfnwyfptjwwfbitlqv.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5amZud3lmcHRqd3dmYml0bHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNTcwMTQsImV4cCI6MjA3NzgzMzAxNH0.efUiL9zcKgJwE5ho_pjvdtFiJsDzJxmIbqDlsFrpF68";
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function fastRemote<T>(promise: PromiseLike<T>, timeoutMs = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        reject(new Error(`Supabase remote query timed out after ${timeoutMs}ms`));
      }, timeoutMs)
    ),
  ]);
}

export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  tableExists: boolean;
  error?: string;
}> {
  try {
    const { error } = await fastRemote<any>(
      supabaseServer.from("b2b_leads").select("id").limit(1)
    );
    if (error) {
      const isMissingTable =
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        (error.message || "").toLowerCase().includes("could not find the table") ||
        (error.message || "").toLowerCase().includes("does not exist");
      return {
        connected: true,
        tableExists: !isMissingTable,
        error: error.message,
      };
    }
    return { connected: true, tableExists: true };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      error: err?.message || "Connection timed out",
    };
  }
}

// Resilient memory store cache for zero-downtime evaluation and fast local demo
declare global {
  var __superadmin_store: {
    leads: Map<string, Lead>;
    research: Map<string, LeadResearch>;
    outreach: Map<string, LeadOutreach>;
    jobs: Map<string, DiscoveryJob>;
    config: ScoringConfig;
    suppression: SuppressionEntry[];
  } | undefined;
}

if (!global.__superadmin_store) {
  global.__superadmin_store = {
    leads: new Map(),
    research: new Map(),
    outreach: new Map(),
    jobs: new Map(),
    config: {
      id: "default-config",
      config_name: "default",
      ai_provider: "gemini",
      ai_api_key: process.env.GEMINI_API_KEY || "",
      ai_model: "gemini-1.5-flash",
      industry_weight: 25,
      scale_weight: 20,
      inventory_complexity_weight: 20,
      accounting_needs_weight: 15,
      contact_availability_weight: 10,
      buying_intent_weight: 10,
      minimum_qualify_score: 60,
      max_leads_per_day: 250,
      auto_research_new_leads: true,
      updated_at: new Date().toISOString(),
    },
    suppression: [
      {
        id: "sup-1",
        identifier_type: "domain",
        identifier_value: "tallynepal.com",
        reason: "competitor",
        created_at: new Date().toISOString(),
      },
      {
        id: "sup-2",
        identifier_type: "company_name",
        identifier_value: "accknown technologies",
        reason: "existing_entity",
        created_at: new Date().toISOString(),
      },
    ],
  };
}

const store = global.__superadmin_store;

export const leadStore = {
  async getLeads(filter?: {
    search?: string;
    industry?: string;
    city?: string;
    status?: string;
    minScore?: number;
    verification?: string;
    page?: number;
    limit?: number;
  }): Promise<{ leads: Lead[]; total: number }> {
    try {
      // Attempt query to Supabase table
      let query = supabaseServer.from("b2b_leads").select("*", { count: "exact" });

      if (filter?.industry && filter.industry !== "all") {
        query = query.eq("industry", filter.industry);
      }
      if (filter?.city && filter.city !== "all") {
        query = query.eq("city", filter.city);
      }
      if (filter?.status && filter.status !== "all") {
        query = query.eq("pipeline_status", filter.status);
      }
      if (filter?.minScore) {
        query = query.gte("lead_score", filter.minScore);
      }
      if (filter?.search) {
        query = query.or(`company_name.ilike.%${filter.search}%,city.ilike.%${filter.search}%`);
      }

      const { data, count, error } = await fastRemote<any>(
        query
          .order("created_at", { ascending: false })
          .range(
            ((filter?.page || 1) - 1) * (filter?.limit || 25),
            (filter?.page || 1) * (filter?.limit || 25) - 1
          )
      );

      if (!error && data) {
        return {
          leads: data as Lead[],
          total: count !== null && count !== undefined ? count : data.length,
        };
      }
      if (error) {
        console.warn("[Supabase getLeads Warning]", error.message);
      }
    } catch (err: any) {
      console.warn("[Supabase getLeads Exception]", err?.message);
    }

    // Memory Store filter fallback
    let all = Array.from(store.leads.values());

    if (filter?.industry && filter.industry !== "all") {
      all = all.filter((l) => l.industry.toLowerCase() === filter.industry?.toLowerCase());
    }
    if (filter?.city && filter.city !== "all") {
      all = all.filter((l) => l.city.toLowerCase() === filter.city?.toLowerCase());
    }
    if (filter?.status && filter.status !== "all") {
      all = all.filter((l) => l.pipeline_status === filter.status);
    }
    if (filter?.minScore) {
      all = all.filter((l) => l.lead_score >= (filter.minScore || 0));
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      all = all.filter(
        (l) =>
          l.company_name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          (l.public_email && l.public_email.toLowerCase().includes(q))
      );
    }

    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const total = all.length;
    const page = filter?.page || 1;
    const limit = filter?.limit || 25;
    const paginated = all.slice((page - 1) * limit, page * limit);

    return { leads: paginated, total };
  },

  async getLeadById(id: string): Promise<Lead | null> {
    try {
      const { data } = await supabaseServer.from("b2b_leads").select("*").eq("id", id).maybeSingle();
      if (data) {
        const lead = data as Lead;
        // attach research & outreach
        const [rRes, oRes] = await Promise.all([
          supabaseServer.from("b2b_lead_research").select("*").eq("lead_id", id).maybeSingle(),
          supabaseServer.from("b2b_lead_outreach").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
        ]);
        lead.research = (rRes.data as LeadResearch) || undefined;
        lead.outreach_drafts = (oRes.data as LeadOutreach[]) || undefined;
        return lead;
      }
    } catch {
      // fallback
    }

    const lead = store.leads.get(id);
    if (lead) {
      lead.research = store.research.get(id);
      lead.outreach_drafts = Array.from(store.outreach.values()).filter((o) => o.lead_id === id);
      return lead;
    }
    return null;
  },

  async saveLead(lead: Partial<Lead>): Promise<Lead> {
    const now = new Date().toISOString();
    const id = lead.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullLead: Lead = {
      id,
      company_name: lead.company_name || "Unknown Business",
      normalized_name: (lead.company_name || "")
        .toLowerCase()
        .replace(/pvt\.?|ltd\.?|private|limited/gi, "")
        .replace(/[^a-z0-9]/g, ""),
      industry: lead.industry || "General Commercial",
      sub_category: lead.sub_category,
      website: lead.website,
      domain: lead.domain || (lead.website ? lead.website.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : undefined),
      business_address: lead.business_address,
      city: lead.city || "Kathmandu",
      district: lead.district || "Kathmandu",
      province: lead.province || "Bagmati",
      public_email: lead.public_email,
      public_phone: lead.public_phone,
      alternate_phone: lead.alternate_phone,
      contact_person: lead.contact_person,
      contact_designation: lead.contact_designation,
      business_description: lead.business_description,
      source_name: lead.source_name || "google_search",
      source_url: lead.source_url || "https://google.com",
      verification_status: lead.verification_status || "unverified",
      lead_score: lead.lead_score || 0,
      priority_tier: lead.priority_tier || "tier_3_medium",
      pipeline_status: lead.pipeline_status || "discovered",
      is_duplicate: lead.is_duplicate || false,
      duplicate_of_id: lead.duplicate_of_id,
      is_suppressed: lead.is_suppressed || false,
      suppression_reason: lead.suppression_reason,
      notes: lead.notes,
      discovered_at: lead.discovered_at || now,
      last_researched_at: lead.last_researched_at,
      created_at: lead.created_at || now,
      updated_at: now,
    };

    try {
      const res = await fastRemote<any>(supabaseServer.from("b2b_leads").upsert(fullLead));
      if (res?.error) {
        console.warn("[Supabase saveLead Warning]", res.error.message);
      }
    } catch (e: any) {
      console.warn("[Supabase saveLead Note]", e?.message);
    }

    store.leads.set(id, fullLead);
    return fullLead;
  },

  async saveResearch(research: Partial<LeadResearch>): Promise<LeadResearch> {
    const now = new Date().toISOString();
    const id = research.id || `res-${Date.now()}`;
    const fullRes: LeadResearch = {
      id,
      lead_id: research.lead_id!,
      executive_summary: research.executive_summary || "",
      estimated_scale: research.estimated_scale || "Small-to-Medium Enterprise",
      estimated_employees: research.estimated_employees || "10-25 Employees",
      estimated_monthly_turnover: research.estimated_monthly_turnover || "NPR 25L - 75L",
      operational_complexity: research.operational_complexity || "Standard Wholesale & Inventory",
      current_software_signals: research.current_software_signals || [],
      verified_facts: research.verified_facts || [],
      ai_assumptions: research.ai_assumptions || [],
      recommended_features: research.recommended_features || [],
      score_breakdown: research.score_breakdown || {
        industry_relevance: 20,
        business_scale: 15,
        inventory_complexity: 15,
        accounting_requirements: 10,
        contact_availability: 8,
        buying_intent: 7,
        total: 75,
      },
      qualification_explanation: research.qualification_explanation || "",
      risks_or_red_flags: research.risks_or_red_flags || [],
      created_at: research.created_at || now,
      updated_at: now,
    };

    try {
      await supabaseServer.from("b2b_lead_research").upsert(fullRes);
      await supabaseServer
        .from("b2b_leads")
        .update({
          lead_score: fullRes.score_breakdown.total,
          pipeline_status: fullRes.score_breakdown.total >= 60 ? "qualified" : "unqualified",
          last_researched_at: now,
        })
        .eq("id", research.lead_id);
    } catch {
      // fallback
    }

    store.research.set(research.lead_id!, fullRes);
    const existing = store.leads.get(research.lead_id!);
    if (existing) {
      existing.lead_score = fullRes.score_breakdown.total;
      existing.pipeline_status = fullRes.score_breakdown.total >= 60 ? "qualified" : "unqualified";
      existing.last_researched_at = now;
      existing.research = fullRes;
    }

    return fullRes;
  },

  async saveOutreach(outreach: Partial<LeadOutreach>): Promise<LeadOutreach> {
    const now = new Date().toISOString();
    const id = outreach.id || `out-${Date.now()}`;
    const fullOut: LeadOutreach = {
      id,
      lead_id: outreach.lead_id!,
      campaign_name: outreach.campaign_name || "Direct Cold Inbound",
      channel: outreach.channel || "email",
      subject_line: outreach.subject_line,
      body_text: outreach.body_text || "",
      key_selling_points: outreach.key_selling_points || [],
      language: outreach.language || "en",
      approval_status: outreach.approval_status || "pending_approval",
      approved_by: outreach.approved_by,
      approved_at: outreach.approved_at,
      rejection_notes: outreach.rejection_notes,
      sent_at: outreach.sent_at,
      created_at: outreach.created_at || now,
    };

    try {
      await supabaseServer.from("b2b_lead_outreach").upsert(fullOut);
    } catch {
      // fallback
    }

    store.outreach.set(id, fullOut);
    return fullOut;
  },

  async updateOutreachStatus(
    id: string,
    status: "approved" | "rejected" | "sent",
    reviewer?: string,
    notes?: string
  ): Promise<LeadOutreach | null> {
    const now = new Date().toISOString();
    const existing = store.outreach.get(id);
    if (existing) {
      existing.approval_status = status;
      if (status === "approved") {
        existing.approved_at = now;
        existing.approved_by = reviewer || "Superadmin Authorizer";
      } else if (status === "rejected") {
        existing.rejection_notes = notes;
      } else if (status === "sent") {
        existing.sent_at = now;
      }
    }

    try {
      await supabaseServer
        .from("b2b_lead_outreach")
        .update({
          approval_status: status,
          approved_at: status === "approved" ? now : undefined,
          approved_by: status === "approved" ? reviewer || "Superadmin Authorizer" : undefined,
          rejection_notes: notes,
          sent_at: status === "sent" ? now : undefined,
        })
        .eq("id", id);
    } catch {
      // fallback
    }

    return existing || null;
  },

  async getJobs(): Promise<DiscoveryJob[]> {
    try {
      const { data } = await supabaseServer.from("b2b_discovery_jobs").select("*").order("created_at", { ascending: false });
      if (data && data.length > 0) return data as DiscoveryJob[];
    } catch {}
    return Array.from(store.jobs.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async saveJob(job: Partial<DiscoveryJob>): Promise<DiscoveryJob> {
    const id = job.id || `job-${Date.now()}`;
    const fullJob: DiscoveryJob = {
      id,
      job_name: job.job_name || "Regional Batch Harvest",
      target_industry: job.target_industry || "FMCG wholesale",
      target_location: job.target_location || "Kathmandu",
      leads_target: job.leads_target || 20,
      leads_found: job.leads_found || 0,
      leads_qualified: job.leads_qualified || 0,
      duplicates_skipped: job.duplicates_skipped || 0,
      status: job.status || "queued",
      error_message: job.error_message,
      execution_duration_sec: job.execution_duration_sec || 0,
      triggered_by: job.triggered_by || "manual",
      created_at: job.created_at || new Date().toISOString(),
      completed_at: job.completed_at,
    };

    try {
      await fastRemote(supabaseServer.from("b2b_discovery_jobs").upsert(fullJob));
    } catch {}

    store.jobs.set(id, fullJob);
    return fullJob;
  },

  async getScoringConfig(): Promise<ScoringConfig> {
    try {
      const { data } = await supabaseServer.from("b2b_scoring_config").select("*").eq("config_name", "default").maybeSingle();
      if (data) return data as ScoringConfig;
    } catch {}
    return store.config;
  },

  async saveScoringConfig(config: Partial<ScoringConfig>): Promise<ScoringConfig> {
    const updated = {
      ...store.config,
      ...config,
      updated_at: new Date().toISOString(),
    };
    try {
      await supabaseServer.from("b2b_scoring_config").upsert(updated);
    } catch {}
    store.config = updated;
    return updated;
  },

  async getSuppressionList(): Promise<SuppressionEntry[]> {
    try {
      const { data } = await fastRemote<any>(
        supabaseServer.from("b2b_suppression_list").select("*").order("created_at", { ascending: false })
      );
      if (data && data.length > 0) return data as SuppressionEntry[];
    } catch {}
    return store.suppression;
  },

  async isSuppressed(domain?: string, email?: string, phone?: string, companyName?: string): Promise<{ suppressed: boolean; reason?: string }> {
    const list = await this.getSuppressionList();
    for (const item of list) {
      if (item.identifier_type === "domain" && domain && domain.toLowerCase().includes(item.identifier_value.toLowerCase())) {
        return { suppressed: true, reason: item.reason };
      }
      if (item.identifier_type === "email" && email && email.toLowerCase() === item.identifier_value.toLowerCase()) {
        return { suppressed: true, reason: item.reason };
      }
      if (item.identifier_type === "company_name" && companyName && companyName.toLowerCase().includes(item.identifier_value.toLowerCase())) {
        return { suppressed: true, reason: item.reason };
      }
    }
    return { suppressed: false };
  },

  async addToSuppression(entry: Omit<SuppressionEntry, "id" | "created_at">): Promise<SuppressionEntry> {
    const item: SuppressionEntry = {
      id: `sup-${Date.now()}`,
      ...entry,
      created_at: new Date().toISOString(),
    };
    try {
      await supabaseServer.from("b2b_suppression_list").insert(item);
    } catch {}
    store.suppression.unshift(item);
    return item;
  },
};
