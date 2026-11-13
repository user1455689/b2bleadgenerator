# Accknown B2B Lead Generator & Intelligence Platform

Autonomous AI-powered B2B lead generation, enrichment, scoring, and outreach platform engineered for Nepalese commercial hubs (Kathmandu, Birgunj, Biratnagar, Pokhara, Butwal, Narayangarh, Nepalgunj).

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Google Gemini 1.5 Pro / Flash**, **Serper.dev**, and **Supabase PostgreSQL**.

---

## Features

1. **Lead Discovery Engine (`/discover`)**:
   - Automated sector & district crawler across trade directories, government registrations, and web search portals.
   - Built-in deduplication (normalized company name, domain, PAN).
   - Rate-limited search and background query planner.

2. **360° Lead Intelligence & Dossier (`/leads`, `/leads/[id]`)**:
   - Multi-dimensional lead scoring (0–100) based on company scale, digital maturity, compliance complexity, and ERP module fit.
   - AI-generated executive summaries, verified facts vs. assumptions, and tailored Accknown ERP module recommendations (IRD Billing, Multi-Branch, FIFO/FEFO Inventory, POS, Manufacturing).

3. **Pipeline Kanban (`/pipeline`)**:
   - Visual sales stage tracking from `Discovered` &rarr; `Researched` &rarr; `Qualified` &rarr; `Outreach Drafted` &rarr; `Contacted` &rarr; `Demo Scheduled` &rarr; `Converted`.

4. **Human-in-the-Loop Outreach Hub (`/outreach`)**:
   - Generates personalized, high-conversion email and WhatsApp drafts in both English and Nepali.
   - Strict human-approval gate before any message is staged or dispatched.

5. **Automation & Schedulers (`/automation`)**:
   - Automated weekly discovery crons via Vercel Cron (`0 3 * * 1`).
   - Opt-out / suppression list governance to avoid contacting existing clients or competitors.

6. **Agent & Weight Configuration (`/config`)**:
   - Fine-tune scoring weights, industry priorities, and LLM temperature/model thresholds.

---

## Tech Stack & Architecture

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & Lucide Icons
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **AI Models**: Google Gemini 1.5 Pro & Flash via Gemini API
- **Web Search**: Serper.dev Google Search API
- **Deployment**: Vercel Serverless & Edge Network

---

## Deployment to Vercel

1. Push or import this repository into your **Vercel** account.
2. Vercel will automatically detect **Next.js**.
3. Add the following **Environment Variables** in **Project Settings → Environment Variables**:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (`https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Public API Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret Key (Server-side only) |
| `GEMINI_API_KEY` | Google Gemini API Key from Google AI Studio |
| `SERPER_API_KEY` | Serper.dev API Key for Google search scraping |
| `SUPERADMIN_SECRET` | Secret token to secure internal endpoints & crons |
| `NEXT_PUBLIC_APP_NAME` | Display name (e.g. `Accknown B2B Lead Intelligence`) |

4. Click **Deploy**.
5. (Optional) In **Project Settings → Domains**, connect your custom subdomain (e.g. `leads.accknown.com` or `superadmin.accknown.com`).

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# (Fill in your Supabase and Gemini keys in .env.local)

# 3. Run development server (runs on port 3005)
npm run dev

# 4. Open http://localhost:3005
```

---

## Database Migration

The database tables are provisioned via the Supabase SQL migration:
`supabase/migrations/20261105000000_b2b_lead_generation_intelligence.sql`.
Tables include `b2b_leads`, `b2b_lead_research`, `b2b_lead_outreach`, `b2b_discovery_jobs`, `b2b_discovery_logs`, `b2b_agent_configs`, and `b2b_suppression_list`.

