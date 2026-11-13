export type LeadStatus =
  | "discovered"
  | "researched"
  | "qualified"
  | "unqualified"
  | "outreach_drafted"
  | "contacted"
  | "demo_scheduled"
  | "converted"
  | "suppressed";

export type VerificationLevel =
  | "unverified"
  | "partially_verified"
  | "verified_direct"
  | "flagged_stale";

export type PriorityTier =
  | "tier_1_urgent"
  | "tier_2_high"
  | "tier_3_medium"
  | "tier_4_low";

export interface ScoreBreakdown {
  industry_relevance: number; // max 25
  business_scale: number; // max 20
  inventory_complexity: number; // max 20
  accounting_requirements: number; // max 15
  contact_availability: number; // max 10
  buying_intent: number; // max 10
  total: number; // 0 - 100
  rationale?: Record<string, string>;
}

export interface VerifiedFact {
  fact: string;
  source: string;
  confidence: number; // 0 - 100%
  extracted_at: string;
}

export interface AIAssumption {
  assumption: string;
  rationale: string;
  likelihood: "high" | "medium" | "speculative";
}

export interface RecommendedFeature {
  module_name: string; // e.g. "IRD Certified Billing & CBMS Sync"
  pain_point_solved: string;
  pitch_angle: string;
  roi_impact: string;
}

export interface ICPProfile {
  target_icp_category: string;
  icp_fit_score: number;
  icp_tier: "Tier 1: Prime ICP Target" | "Tier 2: Strong Commercial ICP" | "Tier 3: Moderate Fit" | "Tier 4: Non-Core";
  key_characteristics: string[];
  erp_urgency_level: "Critical (Immediate)" | "High (30 Days)" | "Medium (Quarterly Planning)" | "Low / Unknown";
  budget_affordability: "High Enterprise" | "Mid-Tier Commercial" | "Budget Conscious SME";
  recommended_package: string;
  decision_maker_personas: string[];
  primary_objections_to_anticipate: string[];
}

export interface LeadResearch {
  id: string;
  lead_id: string;
  executive_summary: string;
  estimated_scale: string;
  estimated_employees: string;
  estimated_monthly_turnover: string;
  operational_complexity: string;
  current_software_signals: string[];
  verified_facts: VerifiedFact[];
  ai_assumptions: AIAssumption[];
  recommended_features: RecommendedFeature[];
  score_breakdown: ScoreBreakdown;
  icp_profile?: ICPProfile;
  qualification_explanation: string;
  risks_or_red_flags: string[];
  created_at: string;
  updated_at: string;
}

export interface LeadOutreach {
  id: string;
  lead_id: string;
  campaign_name: string;
  channel: "email" | "whatsapp" | "phone_script" | "linkedin";
  subject_line?: string;
  body_text: string;
  key_selling_points: string[];
  language: "en" | "np";
  approval_status: "pending_approval" | "approved" | "rejected" | "sent";
  approved_by?: string;
  approved_at?: string;
  rejection_notes?: string;
  sent_at?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  company_name: string;
  normalized_name: string;
  industry: string;
  sub_category?: string;
  website?: string;
  domain?: string;
  business_address?: string;
  city: string;
  district: string;
  province?: string;
  public_email?: string;
  public_phone?: string;
  alternate_phone?: string;
  contact_person?: string;
  contact_designation?: string;
  business_description?: string;
  source_name: string;
  source_url: string;
  verification_status: VerificationLevel;
  lead_score: number;
  priority_tier: PriorityTier;
  icp_tier?: string;
  icp_fit_score?: number;
  pipeline_status: LeadStatus;
  is_duplicate: boolean;
  duplicate_of_id?: string;
  is_suppressed: boolean;
  suppression_reason?: string;
  notes?: string;
  discovered_at: string;
  last_researched_at?: string;
  created_at: string;
  updated_at: string;
  research?: LeadResearch;
  outreach_drafts?: LeadOutreach[];
}

export interface DiscoveryJob {
  id: string;
  job_name: string;
  target_industry: string;
  target_location: string;
  leads_target: number;
  leads_found: number;
  leads_qualified: number;
  duplicates_skipped: number;
  status: "queued" | "running" | "completed" | "failed" | "paused";
  error_message?: string;
  execution_duration_sec: number;
  triggered_by: "cron" | "manual";
  created_at: string;
  completed_at?: string;
}

export type AIProvider = "gemini" | "openai" | "claude" | "groq" | "ollama";

export interface ScoringConfig {
  id: string;
  config_name: string;
  ai_provider?: AIProvider;
  ai_api_key?: string;
  ai_model?: string;
  industry_weight: number;
  scale_weight: number;
  inventory_complexity_weight: number;
  accounting_needs_weight: number;
  contact_availability_weight: number;
  buying_intent_weight: number;
  minimum_qualify_score: number;
  max_leads_per_day: number;
  auto_research_new_leads: boolean;
  updated_at: string;
}

export interface SuppressionEntry {
  id: string;
  identifier_type: "domain" | "email" | "phone" | "company_name";
  identifier_value: string;
  reason: string;
  created_at: string;
}

