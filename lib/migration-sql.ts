export const B2B_MIGRATION_SQL = `-- Accknown B2B Lead Generation and Intelligence Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/meramyjzbdmjhegvspop/sql/new

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'b2b_lead_status') THEN
    CREATE TYPE b2b_lead_status AS ENUM (
      'discovered', 'researched', 'qualified', 'unqualified',
      'outreach_drafted', 'contacted', 'demo_scheduled', 'converted', 'suppressed'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'b2b_verification_level') THEN
    CREATE TYPE b2b_verification_level AS ENUM (
      'unverified', 'partially_verified', 'verified_direct', 'flagged_stale'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'b2b_priority_tier') THEN
    CREATE TYPE b2b_priority_tier AS ENUM (
      'tier_1_urgent', 'tier_2_high', 'tier_3_medium', 'tier_4_low'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.b2b_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  sub_category TEXT,
  website TEXT,
  domain TEXT,
  business_address TEXT,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  province TEXT,
  public_email TEXT,
  public_phone TEXT,
  alternate_phone TEXT,
  contact_person TEXT,
  contact_designation TEXT,
  business_description TEXT,
  source_name TEXT NOT NULL DEFAULT 'google_search',
  source_url TEXT NOT NULL,
  verification_status b2b_verification_level DEFAULT 'unverified',
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  priority_tier b2b_priority_tier DEFAULT 'tier_3_medium',
  pipeline_status b2b_lead_status DEFAULT 'discovered',
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_of_id UUID REFERENCES public.b2b_leads(id) ON DELETE SET NULL,
  is_suppressed BOOLEAN DEFAULT false,
  suppression_reason TEXT,
  notes TEXT,
  discovered_at TIMESTAMPTZ DEFAULT now(),
  last_researched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b2b_lead_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.b2b_leads(id) ON DELETE CASCADE,
  executive_summary TEXT NOT NULL,
  estimated_scale TEXT,
  estimated_employees TEXT,
  estimated_monthly_turnover TEXT,
  operational_complexity TEXT,
  current_software_signals TEXT[] DEFAULT '{}',
  verified_facts JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_features JSONB NOT NULL DEFAULT '[]'::jsonb,
  score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  qualification_explanation TEXT NOT NULL,
  risks_or_red_flags TEXT[] DEFAULT '{}',
  raw_gemini_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b2b_lead_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.b2b_leads(id) ON DELETE CASCADE,
  campaign_name TEXT DEFAULT 'Direct GTM Discovery',
  channel TEXT NOT NULL DEFAULT 'email',
  subject_line TEXT,
  body_text TEXT NOT NULL,
  key_selling_points TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'en',
  approval_status TEXT DEFAULT 'pending_approval' CHECK (approval_status IN ('pending_approval', 'approved', 'rejected', 'sent')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_notes TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b2b_discovery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  target_industry TEXT NOT NULL,
  target_location TEXT NOT NULL,
  leads_target INTEGER DEFAULT 25,
  leads_found INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  duplicates_skipped INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'paused')),
  error_message TEXT,
  execution_duration_sec NUMERIC DEFAULT 0,
  triggered_by TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.b2b_scoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_name TEXT NOT NULL UNIQUE DEFAULT 'default',
  industry_weight INTEGER DEFAULT 25,
  scale_weight INTEGER DEFAULT 20,
  inventory_complexity_weight INTEGER DEFAULT 20,
  accounting_needs_weight INTEGER DEFAULT 15,
  contact_availability_weight INTEGER DEFAULT 10,
  buying_intent_weight INTEGER DEFAULT 10,
  minimum_qualify_score INTEGER DEFAULT 60,
  max_leads_per_day INTEGER DEFAULT 250,
  auto_research_new_leads BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b2b_suppression_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('domain', 'email', 'phone', 'company_name')),
  identifier_value TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2b_leads_domain ON public.b2b_leads(domain);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_normalized_name ON public.b2b_leads(normalized_name);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_industry_city ON public.b2b_leads(industry, city);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_score_status ON public.b2b_leads(lead_score DESC, pipeline_status);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_created_at ON public.b2b_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_b2b_suppression_val ON public.b2b_suppression_list(identifier_value);

INSERT INTO public.b2b_scoring_config (
  config_name, industry_weight, scale_weight, inventory_complexity_weight,
  accounting_needs_weight, contact_availability_weight, buying_intent_weight,
  minimum_qualify_score, max_leads_per_day, auto_research_new_leads
) VALUES ('default', 25, 20, 20, 15, 10, 10, 60, 250, true)
ON CONFLICT (config_name) DO NOTHING;

-- Grant permissions to public/anon & authenticated access
ALTER TABLE public.b2b_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to b2b_leads" ON public.b2b_leads;
CREATE POLICY "Allow all access to b2b_leads" ON public.b2b_leads FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.b2b_lead_research ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to b2b_lead_research" ON public.b2b_lead_research;
CREATE POLICY "Allow all access to b2b_lead_research" ON public.b2b_lead_research FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.b2b_lead_outreach ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to b2b_lead_outreach" ON public.b2b_lead_outreach;
CREATE POLICY "Allow all access to b2b_lead_outreach" ON public.b2b_lead_outreach FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.b2b_discovery_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to b2b_discovery_jobs" ON public.b2b_discovery_jobs;
CREATE POLICY "Allow all access to b2b_discovery_jobs" ON public.b2b_discovery_jobs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.b2b_scoring_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to b2b_scoring_config" ON public.b2b_scoring_config;
CREATE POLICY "Allow all access to b2b_scoring_config" ON public.b2b_scoring_config FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.b2b_suppression_list ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to b2b_suppression_list" ON public.b2b_suppression_list;
CREATE POLICY "Allow all access to b2b_suppression_list" ON public.b2b_suppression_list FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.b2b_leads TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.b2b_lead_research TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.b2b_lead_outreach TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.b2b_discovery_jobs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.b2b_scoring_config TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.b2b_suppression_list TO anon, authenticated, service_role;
`;

