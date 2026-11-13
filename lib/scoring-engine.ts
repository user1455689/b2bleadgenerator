import { Lead, ScoreBreakdown, ScoringConfig } from "../types/lead";
import { TARGET_INDUSTRIES } from "./nepal-market-data";

export interface ScoringFactors {
  industryName: string;
  hasWebsite: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasAddress: boolean;
  estimatedEmployees?: string;
  operationalKeywords?: string[];
  mentionsTaxOrVat?: boolean;
  mentionsTallyOrLegacy?: boolean;
  multiBranchSignal?: boolean;
  isManufacturerOrDistributor?: boolean;
}

export function calculateLeadScore(
  lead: Partial<Lead>,
  customConfig?: Partial<ScoringConfig>,
  contextSignals: string[] = []
): ScoreBreakdown {
  const config = {
    industry_weight: customConfig?.industry_weight ?? 25,
    scale_weight: customConfig?.scale_weight ?? 20,
    inventory_complexity_weight: customConfig?.inventory_complexity_weight ?? 20,
    accounting_needs_weight: customConfig?.accounting_needs_weight ?? 15,
    contact_availability_weight: customConfig?.contact_availability_weight ?? 10,
    buying_intent_weight: customConfig?.buying_intent_weight ?? 10,
  };

  const rationale: Record<string, string> = {};

  // 1. Industry Relevance (Max 25 pts)
  let industryScore = 0;
  const indMatch = TARGET_INDUSTRIES.find(
    (ind) =>
      ind.name.toLowerCase() === (lead.industry || "").toLowerCase() ||
      (lead.industry || "").toLowerCase().includes(ind.id) ||
      ind.keywords.some((k) => (lead.industry || "").toLowerCase().includes(k))
  );

  if (indMatch) {
    const ratio = indMatch.defaultWeight / 25;
    industryScore = Math.round(ratio * config.industry_weight);
    rationale.industry_relevance = `Matches core target vertical '${indMatch.name}' with standard qualification weight ${industryScore}/${config.industry_weight}.`;
  } else {
    industryScore = Math.round(0.4 * config.industry_weight);
    rationale.industry_relevance = `Generic commercial sector (${lead.industry || "General Trade"}), assigned baseline relevance ${industryScore}/${config.industry_weight}.`;
  }

  // 2. Business Scale (Max 20 pts)
  let scaleScore = 0;
  const combinedText = `${lead.company_name || ""} ${lead.business_description || ""} ${contextSignals.join(" ")}`.toLowerCase();

  const isLarge = /group|industries|national|holdings|enterprises|mills|wholesaler|distributor|depot/i.test(combinedText);
  const isMedium = /suppliers|traders|dealers|mart|stores|pharma|sanitary/i.test(combinedText);

  if (isLarge) {
    scaleScore = config.scale_weight;
    rationale.business_scale = `Indicators of wholesale distributor/industrial scale detected (${scaleScore}/${config.scale_weight}).`;
  } else if (isMedium) {
    scaleScore = Math.round(0.75 * config.scale_weight);
    rationale.business_scale = `Mid-scale trading or commercial store footprint identified (${scaleScore}/${config.scale_weight}).`;
  } else {
    scaleScore = Math.round(0.5 * config.scale_weight);
    rationale.business_scale = `Single-establishment small retail or consulting operation (${scaleScore}/${config.scale_weight}).`;
  }

  // 3. Inventory Complexity (Max 20 pts)
  let inventoryScore = 0;
  const isHeavyInventory = /fmcg|pharma|hardware|tiles|sanitary|grocery|supermarket|distributor|manufacturing|factory/i.test(
    `${lead.industry || ""} ${combinedText}`
  );
  const isBatchOrDualUnit = /expiry|batch|carton|piece|sq ft|box|kg|bundle|bom|raw material/i.test(combinedText);

  if (isHeavyInventory && isBatchOrDualUnit) {
    inventoryScore = config.inventory_complexity_weight;
    rationale.inventory_complexity = `Complex inventory model detected: dual-unit packing or batch/expiry management requirement (${inventoryScore}/${config.inventory_complexity_weight}).`;
  } else if (isHeavyInventory) {
    inventoryScore = Math.round(0.8 * config.inventory_complexity_weight);
    rationale.inventory_complexity = `Multi-SKU inventory with standard warehouse storage requirements (${inventoryScore}/${config.inventory_complexity_weight}).`;
  } else {
    inventoryScore = Math.round(0.35 * config.inventory_complexity_weight);
    rationale.inventory_complexity = `Low SKU count or service-focused operational model (${inventoryScore}/${config.inventory_complexity_weight}).`;
  }

  // 4. Accounting Software Requirements (Max 15 pts)
  let accountingScore = 0;
  const isNepalTaxBound = /pvt ltd|ltd|vat|pan|tax|compliance|invoicing|billing|audit/i.test(
    `${lead.company_name || ""} ${lead.business_description || ""}`
  );
  const usesLegacy = /tally|busy|excel|manual|paper|legacy/i.test(combinedText);

  if (isNepalTaxBound && usesLegacy) {
    accountingScore = config.accounting_needs_weight;
    rationale.accounting_requirements = `High priority: Company subject to mandatory IRD billing and signals legacy desktop migration need (${accountingScore}/${config.accounting_needs_weight}).`;
  } else if (isNepalTaxBound) {
    accountingScore = Math.round(0.85 * config.accounting_needs_weight);
    rationale.accounting_requirements = `Registered corporate entity requiring IRD-certified VAT billing & CBMS sync (${accountingScore}/${config.accounting_needs_weight}).`;
  } else {
    accountingScore = Math.round(0.5 * config.accounting_needs_weight);
    rationale.accounting_requirements = `Standard SME general ledger and party balance tracking need (${accountingScore}/${config.accounting_needs_weight}).`;
  }

  // 5. Contact Reachability (Max 10 pts)
  let contactScore = 0;
  const hasPhone = !!lead.public_phone && lead.public_phone.length >= 7;
  const hasEmail = !!lead.public_email && lead.public_email.includes("@");
  const hasWebsite = !!lead.website && lead.website.startsWith("http");
  const hasAddress = !!lead.business_address && lead.business_address.length > 5;

  if (hasPhone) contactScore += Math.round(0.5 * config.contact_availability_weight);
  if (hasEmail) contactScore += Math.round(0.3 * config.contact_availability_weight);
  if (hasWebsite || hasAddress) contactScore += Math.round(0.2 * config.contact_availability_weight);

  contactScore = Math.min(config.contact_availability_weight, contactScore);
  rationale.contact_availability = `Contact availability score: Phone (${hasPhone ? "✓" : "✗"}), Email (${
    hasEmail ? "✓" : "✗"
  }), Address/Web (${hasWebsite || hasAddress ? "✓" : "✗"}) yielding ${contactScore}/${config.contact_availability_weight}.`;

  // 6. Buying Intent & Growth Signals (Max 10 pts)
  let intentScore = 0;
  const hasGrowthSignal = /expanding|new branch|opening|hiring|dealer inquiry|distributor network|contact us for wholesale/i.test(
    combinedText
  );
  const isFreshDiscovery = lead.source_url && lead.source_url.length > 10;

  if (hasGrowthSignal) {
    intentScore = config.buying_intent_weight;
    rationale.buying_intent = `Active expansion or distribution growth signals detected in public profiles (${intentScore}/${config.buying_intent_weight}).`;
  } else if (isFreshDiscovery) {
    intentScore = Math.round(0.6 * config.buying_intent_weight);
    rationale.buying_intent = `Active web presence verified through recent indexation (${intentScore}/${config.buying_intent_weight}).`;
  } else {
    intentScore = Math.round(0.3 * config.buying_intent_weight);
    rationale.buying_intent = `Passive market presence; cold outbound qualification recommended (${intentScore}/${config.buying_intent_weight}).`;
  }

  const total = Math.min(
    100,
    Math.max(0, industryScore + scaleScore + inventoryScore + accountingScore + contactScore + intentScore)
  );

  return {
    industry_relevance: industryScore,
    business_scale: scaleScore,
    inventory_complexity: inventoryScore,
    accounting_requirements: accountingScore,
    contact_availability: contactScore,
    buying_intent: intentScore,
    total,
    rationale,
  };
}
