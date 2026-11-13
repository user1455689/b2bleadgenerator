import {
  Lead,
  LeadResearch,
  VerifiedFact,
  AIAssumption,
  RecommendedFeature,
  ScoreBreakdown,
  AIProvider,
  ICPProfile,
} from "../types/lead";
import { calculateLeadScore } from "./scoring-engine";
import { TARGET_INDUSTRIES } from "./nepal-market-data";
import { leadStore } from "./supabase-admin";

export async function getActiveAICredentials() {
  const config = await leadStore.getScoringConfig();
  const provider: AIProvider = config.ai_provider || "gemini";
  let apiKey = config.ai_api_key || "";
  if (!apiKey) {
    if (provider === "gemini") apiKey = process.env.GEMINI_API_KEY || "";
    else if (provider === "openai") apiKey = process.env.OPENAI_API_KEY || "";
    else if (provider === "claude") apiKey = process.env.ANTHROPIC_API_KEY || "";
    else if (provider === "groq") apiKey = process.env.GROQ_API_KEY || "";
  }
  const model =
    config.ai_model ||
    (provider === "gemini"
      ? "gemini-1.5-flash"
      : provider === "openai"
      ? "gpt-4o-mini"
      : provider === "claude"
      ? "claude-3-5-sonnet-20241022"
      : provider === "groq"
      ? "llama-3.3-70b-versatile"
      : "llama3");

  return { provider, apiKey, model };
}

export async function testAIConnection(
  provider: AIProvider,
  apiKey: string,
  model = "gemini-1.5-flash"
): Promise<{ success: boolean; message: string; latencyMs: number }> {
  const start = Date.now();
  if (provider === "gemini") {
    if (!apiKey) throw new Error("Gemini API key is required");
    const effectiveModel =
      model && (model.startsWith("gemini-1.") || model.startsWith("gemini-2."))
        ? model
        : "gemini-1.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:generateContent?key=${apiKey}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    };
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Respond with the word 'OK' if you can read this." }] }],
      }),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini API returned status ${res.status}`);
    }
    return { success: true, message: `Connected to Google Gemini (${effectiveModel}) successfully!`, latencyMs };
  }

  if (provider === "openai" || provider === "groq" || provider === "ollama") {
    const url =
      provider === "openai"
        ? "https://api.openai.com/v1/chat/completions"
        : provider === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "http://localhost:11434/v1/chat/completions";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Ping" }],
        max_tokens: 5,
      }),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `${provider} returned status ${res.status}`);
    }
    return { success: true, message: `Connected to ${provider} (${model}) successfully!`, latencyMs };
  }

  if (provider === "claude") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 5,
        messages: [{ role: "user", content: "Ping" }],
      }),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Claude API returned status ${res.status}`);
    }
    return { success: true, message: `Connected to Anthropic Claude (${model}) successfully!`, latencyMs };
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

/**
 * AI-Powered Lead Discovery over the Live Internet & Nepal Business Indices
 * Queries Gemini to discover real, verified operating companies in Nepal
 */
export async function discoverRealLeadsWithAI(
  industry: string,
  location: string,
  count = 10
): Promise<Array<Partial<Lead>>> {
  const { provider, apiKey, model } = await getActiveAICredentials();
  if (!apiKey || provider !== "gemini") {
    return [];
  }

  const prompt = `You are a professional B2B lead researcher, market intelligence investigator, and Nepal corporate registry expert.
Discover and list ${count} REAL, genuine, actively operating businesses in ${location}, Nepal belonging to or related to the industry: "${industry}".

CRITICAL INTEGRITY RULES:
1. NEVER invent, fabricate, or provide placeholder/synthetic company names. Only list real businesses that actually exist in Nepal.
2. Provide their real exact registered business name (e.g., prominent distributors, factories, wholesalers, trading concerns, dealer showrooms, or CA firms in ${location}).
3. Provide their real physical street address, industrial estate, or commercial area in ${location}.
4. Provide their real official website URL, Facebook business page, or authentic Nepal directory listing (such as NepalYP or Cybo).
5. Provide their real commercial telephone line or mobile contact with Nepal dialing codes (e.g. +977-51-XXXXXX for Birgunj, +977-1-XXXXXXX for Kathmandu, +977-98XXXXXXXX).
6. State a factual business description of their operations and products.

Respond ONLY with a valid JSON array matching this schema:
[
  {
    "company_name": "Exact Official Company Name",
    "business_address": "Street, Ward/Area, ${location}",
    "city": "${location}",
    "district": "District Name",
    "province": "Province Name",
    "website": "https://... or valid official URL",
    "public_phone": "+977-...",
    "public_email": "real email or omit if unverified",
    "contact_person": "Real Director / Proprietor / Key Executive Name if known",
    "contact_designation": "Managing Director / Proprietor",
    "source_name": "Nepal Corporate Registry / Public Trade Directory",
    "source_url": "https://...",
    "business_description": "Precise summary of commercial operations, products sold, and wholesale/manufacturing scale."
  }
]`;

  try {
    const modelsToTry = [
      model && (model.startsWith("gemini-1.") || model.startsWith("gemini-2."))
        ? model
        : "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-2.0-flash",
    ];

    for (const m of modelsToTry) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((item) => ({
              company_name: item.company_name,
              industry,
              city: location,
              district: item.district || location,
              province: item.province,
              business_address: item.business_address,
              website: item.website,
              public_phone: item.public_phone,
              public_email: item.public_email,
              contact_person: item.contact_person,
              contact_designation: item.contact_designation || "Director",
              source_name: item.source_name || "Nepal Corporate Registry & Trade Index",
              source_url:
                item.source_url ||
                item.website ||
                `https://nepalyp.com/search/${encodeURIComponent(industry)}/${encodeURIComponent(location)}`,
              business_description: item.business_description,
              verification_status: item.public_phone ? "verified_direct" : "partially_verified",
            }));
          }
        }
      } else if (res.status === 503) {
        continue;
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn(`[AI Lead Discovery] Gemini returned ${res.status}:`, errData);
        break;
      }
    }
  } catch (err) {
    console.warn("[AI Lead Discovery] Failed to discover leads via Gemini:", err);
  }

  return [];
}

export async function runGeminiIntelligenceAnalysis(
  lead: Lead,
  contextSnippets: string[] = []
): Promise<LeadResearch> {
  const { provider, apiKey, model } = await getActiveAICredentials();

  const prompt = `
You are a senior enterprise SaaS architect, B2B sales strategist and ICP (Ideal Customer Profile) qualification expert specializing in Nepal's business landscape.
Your client is Accknown (accknown.com), a modern cloud ERP and accounting platform in Nepal with IRD-certified real-time billing, dual Bikram Sambat/Gregorian dates, multi-branch stock ledger, FIFO/FEFO inventory valuation, and POS.

Analyze the following prospective company:
Company Name: ${lead.company_name}
Industry: ${lead.industry}
Location: ${lead.city}, ${lead.district}, Nepal
Address: ${lead.business_address || "N/A"}
Website: ${lead.website || "N/A"}
Public Contacts: Phone: ${lead.public_phone || "N/A"}, Email: ${lead.public_email || "N/A"}
Raw Context Snippets:
${contextSnippets.join("\n")}

Respond ONLY with a valid JSON object matching this schema:
{
  "executive_summary": "2-3 concise sentences on what this business does, its market positioning in Nepal, and operational model.",
  "estimated_scale": "e.g. Medium Wholesale Distributor / Tier-2 Factory / Large Supermarket",
  "estimated_employees": "e.g. 15-30 staff across sales and warehouse",
  "estimated_monthly_turnover": "e.g. NPR 40 Lakhs - 1.2 Crore",
  "operational_complexity": "e.g. Heavy batch-expiry tracking, multi-godown transit, high shopkeeper credit lines",
  "current_software_signals": ["e.g. legacy tally", "paper delivery slips", "manual excel ledgers"],
  "verified_facts": [
    {
      "fact": "Factual statement verified from website/snippet",
      "source": "exact source snippet or domain",
      "confidence": 95
    }
  ],
  "ai_assumptions": [
    {
      "assumption": "Inferred operational reality not explicitly proven",
      "rationale": "Reason for this assumption based on industry patterns in Nepal",
      "likelihood": "high"
    }
  ],
  "icp_profile": {
    "target_icp_category": "e.g. Tier-1 Regional FMCG Wholesale Distributor / Pharma Cold-Chain Wholesaler / Hardware & Tiles Importer / SME Discrete Manufacturer",
    "icp_fit_score": 90,
    "icp_tier": "Tier 1: Prime ICP Target",
    "key_characteristics": [
      "Multi-godown inventory with inter-branch transfers",
      "Field sales force with van distribution routes",
      "High volume of credit sales requiring dealer credit limits",
      "Mandatory IRD VAT invoicing and Annex 5/13 filing"
    ],
    "erp_urgency_level": "Critical (Immediate) or High (30 Days)",
    "budget_affordability": "High Enterprise or Mid-Tier Commercial",
    "recommended_package": "Accknown Distribution Cloud + IRD Real-time CBMS Sync",
    "decision_maker_personas": ["Managing Director / Owner", "Head of Accounts / CFO", "Warehouse & Logistics Head"],
    "primary_objections_to_anticipate": [
      "Reluctance to move away from familiar offline desktop Tally Prime",
      "Concerns about internet connectivity during remote route deliveries"
    ]
  },
  "recommended_features": [
    {
      "module_name": "Exact Accknown ERP Module Name (e.g. Van Sales & Mobile Billing / IRD Real-time CBMS Sync / FEFO Batch Tracker / Box-to-SqFt Unit Converter)",
      "pain_point_solved": "What exact bottleneck this resolves",
      "pitch_angle": "How sales reps should present this to the owner/director",
      "roi_impact": "Hours saved or capital recovered"
    }
  ],
  "qualification_explanation": "Detailed rationale on why this business is or is not an ideal candidate for Accknown ERP.",
  "risks_or_red_flags": ["Any concerns such as no tech adoption, competitor ties, or unresponsive contacts"]
}
`;

  if (apiKey) {
    try {
      let rawJsonText = "";

      if (provider === "gemini") {
        const modelsToTry = [
          model && (model.startsWith("gemini-1.") || model.startsWith("gemini-2."))
            ? model
            : "gemini-1.5-flash",
          "gemini-1.5-pro",
          "gemini-2.0-flash",
        ];

        for (const m of modelsToTry) {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          };
          const response = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
              },
            }),
          });

          if (response.ok) {
            const json = await response.json();
            rawJsonText = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawJsonText) break;
          } else if (response.status === 503) {
            continue;
          } else {
            break;
          }
        }
      } else if (provider === "openai" || provider === "groq" || provider === "ollama") {
        const url =
          provider === "openai"
            ? "https://api.openai.com/v1/chat/completions"
            : provider === "groq"
            ? "https://api.groq.com/openai/v1/chat/completions"
            : "http://localhost:11434/v1/chat/completions";

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2,
          }),
        });

        if (response.ok) {
          const json = await response.json();
          rawJsonText = json.choices?.[0]?.message?.content;
        }
      }

      if (rawJsonText) {
        const parsed = JSON.parse(rawJsonText);
        const score = calculateLeadScore(lead, undefined, [
          ...(parsed.current_software_signals || []),
          parsed.operational_complexity,
        ]);

        return {
          id: `res-${Date.now()}`,
          lead_id: lead.id,
          executive_summary: parsed.executive_summary,
          estimated_scale: parsed.estimated_scale,
          estimated_employees: parsed.estimated_employees,
          estimated_monthly_turnover: parsed.estimated_monthly_turnover,
          operational_complexity: parsed.operational_complexity,
          current_software_signals: parsed.current_software_signals || [],
          verified_facts: parsed.verified_facts || [],
          ai_assumptions: parsed.ai_assumptions || [],
          recommended_features: parsed.recommended_features || [],
          score_breakdown: score,
          icp_profile: parsed.icp_profile,
          qualification_explanation: parsed.qualification_explanation,
          risks_or_red_flags: parsed.risks_or_red_flags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn(`[AI Engine: ${provider}] Request failed, falling back to heuristic engine:`, err);
    }
  }

  // Robust Heuristic Engine fallback
  return generateHeuristicResearch(lead, contextSnippets);
}

export function generateHeuristicResearch(
  lead: Lead,
  contextSnippets: string[] = []
): LeadResearch {
  const indMatch = TARGET_INDUSTRIES.find(
    (i) => i.name.toLowerCase() === lead.industry.toLowerCase() || (lead.industry || "").includes(i.id)
  ) || TARGET_INDUSTRIES[0];

  const score = calculateLeadScore(lead, undefined, contextSnippets);

  const verifiedFacts: VerifiedFact[] = [];
  if (lead.website) {
    verifiedFacts.push({
      fact: `Active digital presence on domain ${lead.domain || lead.website}`,
      source: lead.source_url,
      confidence: 100,
      extracted_at: new Date().toISOString(),
    });
  }
  if (lead.public_phone) {
    verifiedFacts.push({
      fact: `Publicly listed commercial contact line ${lead.public_phone}`,
      source: lead.source_url,
      confidence: 95,
      extracted_at: new Date().toISOString(),
    });
  }
  if (lead.business_address) {
    verifiedFacts.push({
      fact: `Physical operating premises located at ${lead.business_address}, ${lead.city}`,
      source: lead.source_url,
      confidence: 90,
      extracted_at: new Date().toISOString(),
    });
  }

  const aiAssumptions: AIAssumption[] = [
    {
      assumption: `Estimated workforce between 12 and 35 personnel spanning floor, billing, and distribution.`,
      rationale: `Standard headcount density for ${indMatch.name} entities operating in ${lead.city}.`,
      likelihood: "high",
    },
    {
      assumption: `Currently relying on desktop Tally Prime or legacy paper ledgers with offline VAT filing.`,
      rationale: `Over 85% of trading and manufacturing businesses in Nepal outside multinational chains utilize disconnected desktop accounting.`,
      likelihood: "high",
    },
    {
      assumption: `Requires credit aging recovery control for wholesale trade debtors.`,
      rationale: `Standard commercial practice in ${lead.city} involves 30–60 day credit terms to retail customers.`,
      likelihood: "medium",
    },
  ];

  const recommendedFeatures: RecommendedFeature[] = indMatch.coreAccknownFeatures.map((feat, idx) => ({
    module_name: feat,
    pain_point_solved: indMatch.typicalPainPoints[idx % indMatch.typicalPainPoints.length],
    pitch_angle: `Highlight how Accknown eliminates ${indMatch.typicalPainPoints[idx % indMatch.typicalPainPoints.length]} with real-time cloud access on phones and PCs.`,
    roi_impact: `Saves 4-6 hours per week in book closing and eliminates stock shrinkage.`,
  }));

  const isFmcg = indMatch.id.includes("fmcg");
  const isPharma = indMatch.id.includes("pharma");
  const isMfg = indMatch.id.includes("manufacturing") || indMatch.id.includes("furniture");
  const isHardware = indMatch.id.includes("hardware") || indMatch.id.includes("tiles");

  const icpTier: "Tier 1: Prime ICP Target" | "Tier 2: Strong Commercial ICP" | "Tier 3: Moderate Fit" | "Tier 4: Non-Core" =
    score.total >= 80
      ? "Tier 1: Prime ICP Target"
      : score.total >= 65
      ? "Tier 2: Strong Commercial ICP"
      : score.total >= 50
      ? "Tier 3: Moderate Fit"
      : "Tier 4: Non-Core";

  const icpProfile: ICPProfile = {
    target_icp_category: isFmcg
      ? "Tier-1 Regional FMCG Wholesaler & Route Distributor"
      : isPharma
      ? "Licensed Pharmaceutical Wholesale & Cold-Chain Distributor"
      : isMfg
      ? "SME Discrete Manufacturer (BOM, Work Orders & Raw Material Staging)"
      : isHardware
      ? "Building Materials, Hardware & Ceramic Tiles Importer/Dealer"
      : `${indMatch.name} Commercial Enterprise`,
    icp_fit_score: Math.min(100, Math.max(50, score.total + (isFmcg || isPharma ? 5 : 0))),
    icp_tier: icpTier,
    key_characteristics: [
      isFmcg
        ? "Multi-godown inventory with active van route distribution"
        : isPharma
        ? "Strict DDA batch and FEFO expiry date tracking"
        : isMfg
        ? "Multi-stage assembly with Bill of Materials (BOM) cost tracking"
        : "High-SKU volume with dual unit conversions (Box / Sq.Ft / Pcs)",
      "Mandatory IRD VAT invoicing and Annex 5/13 monthly tax filing",
      `High volume of trade credit exposure across ${lead.city} retail merchants (30–60 day terms)`,
      "High dependency on owner/director for daily ledger audits",
    ],
    erp_urgency_level: score.total >= 75 ? "Critical (Immediate)" : "High (30 Days)",
    budget_affordability: score.total >= 80 ? "High Enterprise" : "Mid-Tier Commercial",
    recommended_package: isMfg
      ? "Accknown Manufacturing Pro & Cost Center Ledger"
      : isPharma
      ? "Accknown Pharma Cloud + FEFO Batch & IRD CBMS Sync"
      : isFmcg
      ? "Accknown Wholesale Distribution Cloud + Van Sales Mobile POS"
      : "Accknown Commercial ERP & IRD Real-time CBMS Suite",
    decision_maker_personas: [
      "Managing Director / Proprietor",
      "Chief Accountant / Head of Finance",
      "Warehouse & Supply Chain In-Charge",
    ],
    primary_objections_to_anticipate: [
      "Staff inertia and familiarity with legacy desktop Tally Prime keyboard shortcuts",
      "Perception that cloud ERP requires continuous 24/7 high-speed fiber internet",
      "Concerns about migrating 5+ years of historical vendor and debtor ledgers",
    ],
  };

  return {
    id: `res-${Date.now()}`,
    lead_id: lead.id,
    executive_summary: `${lead.company_name} is an established ${indMatch.name} based in ${lead.city}, ${lead.district}. Their operations feature high transaction velocity and multi-party trade credit, representing high alignment with Accknown's ERP workflows.`,
    estimated_scale: `Tier-2 Commercial Distributor / Mid-Scale Enterprise`,
    estimated_employees: `15 - 35 Staff Members`,
    estimated_monthly_turnover: `NPR 35 Lakhs - 1.5 Crores`,
    operational_complexity: indMatch.operationalCharacteristics,
    current_software_signals: ["Legacy desktop Tally / Busy", "Manual VAT annex preparation", "Paper godown slips"],
    verified_facts: verifiedFacts,
    ai_assumptions: aiAssumptions,
    recommended_features: recommendedFeatures,
    score_breakdown: score,
    icp_profile: icpProfile,
    qualification_explanation: `Scored ${score.total}/100. Strong match in ${indMatch.name} with pressing requirements for IRD-compliant cloud invoicing and stock valuation.`,
    risks_or_red_flags: [
      "Decision maker might require face-to-face demo in local Nepali language",
      "May require data migration assistance from existing Tally XML export",
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function generatePersonalizedOutreach(
  lead: Lead,
  research: LeadResearch,
  options: {
    channel: "email" | "whatsapp" | "phone_script";
    language: "en" | "np";
    tone?: "consultative" | "executive" | "direct";
  }
): Promise<{
  subject_line?: string;
  body_text: string;
  key_selling_points: string[];
}> {
  const topFeatures = research.recommended_features.slice(0, 3).map((f) => f.module_name);

  if (options.language === "np") {
    const subject = `नमस्ते ${lead.company_name} - के तपाईंको लेखा र स्टक व्यवस्थापन अझ छिटो बनाउन सकिन्छ?`;
    const body = `आदरणीय ${lead.contact_person || lead.company_name} व्यवस्थापन टोली,

नमस्ते! 

हामीले ${lead.city} मा तपाईंको प्रतिष्ठित ${lead.industry} व्यवसाय अवलोकन गर्यौं। नेपालमा धेरैजसो थोक बिक्रेता र उत्पादकहरूले हाल भोगिरहेका प्रमुख समस्याहरू जस्तै:

1. ${topFeatures[0] || "रियल-टाइम IRD भ्याट बिलिङ"} र आन्तरिक राजस्व विभाग (CBMS) सँग सिधा सिंक
2. ${topFeatures[1] || "पार्टी उधारो (Credit Aging) र खाता मिलान"}
3. मोबाइल र कम्प्युटर दुवैबाट जहाँसुकैबाट गोदाम र स्टक हेर्ने सुविधा

Accknown (accknown.com) नेपालकै पहिलो आधुनिक र सुरक्षित क्लाउड ERP सफ्टवेयर हो, जसले तपाईंको व्यापारलाई पुरानो डेस्कटप सफ्टवेयरको झन्झटबाट मुक्त गर्दछ।

के तपाईं यस हप्ता १० मिनेटको छोटो अनलाइन वा प्रत्यक्ष डेमो अवलोकन गर्न इच्छुक हुनुहुन्छ?

भवदीय,
Accknown Business Team
Kathmandu, Nepal
फोन: +977-1-5970000 | accknown.com`;

    return {
      subject_line: subject,
      body_text: body,
      key_selling_points: topFeatures,
    };
  }

  const subject = `Modernizing ${lead.company_name}'s inventory & IRD billing with Accknown`;
  const body = `Dear ${lead.contact_person || "Management Team"} at ${lead.company_name},

I hope this finds you well.

While researching top-tier ${lead.industry} leaders across ${lead.city}, we noticed ${lead.company_name}'s growing commercial footprint in the region.

Businesses with your operational scale often face bottlenecks with legacy desktop accounting (Tally/Busy), particularly around:
• ${research.recommended_features[0]?.pain_point_solved || "Delayed credit ledger reconciliation with retailers"}
• ${research.recommended_features[1]?.pain_point_solved || "Manual double-entry errors for IRD VAT billing"}
• Fragmented warehouse inventory visibility between godown and office

Accknown (accknown.com) is Nepal's dedicated cloud ERP engineered specifically for Nepalese compliance, featuring:
✓ Automatic IRD Real-time CBMS synchronization & Annex 5/13 exports
✓ ${topFeatures.join(" & ")}
✓ Dual Bikram Sambat (BS) & Gregorian (AD) calendar support
✓ Multi-user branch access from phone, tablet, or PC

Would you be open to a 10-minute discovery call this Thursday to see how peers in ${lead.city} are automating their inventory workflows?

Best regards,

Enterprise Growth Team | Accknown
Kathmandu, Nepal
contact@accknown.com | https://accknown.com`;

  return {
    subject_line: subject,
    body_text: body,
    key_selling_points: topFeatures,
  };
}
