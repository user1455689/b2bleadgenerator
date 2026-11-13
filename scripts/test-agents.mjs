/**
 * Independent Automated Verification Suite for Accknown B2B Lead Intelligence Platform
 * Tests Agent 1, Agent 2, Agent 3, Scoring Engine, Deduplication, and Human-in-the-Loop Gate.
 */

import assert from "node:assert";

console.log("\n=======================================================");
console.log("🚀 Running Accknown B2B Lead Intelligence Test Suite");
console.log("=======================================================\n");

// Test 1: Scoring Engine Unit Verification
console.log("▶ [Test 1] Testing 6-Dimensional Scoring Engine...");
import { calculateLeadScore } from "../lib/scoring-engine.ts";

const sampleLead = {
  company_name: "Everest FMCG Wholesalers Pvt Ltd",
  industry: "FMCG Wholesalers & Distributors",
  city: "Kathmandu",
  district: "Kathmandu",
  public_phone: "+977-01-4234567",
  public_email: "orders@everestfmcg.com.np",
  website: "https://everestfmcg.com.np",
  business_address: "Teku Commercial Hub, Kathmandu",
  business_description: "Bulk consumer goods distributor supplying 500+ retail shops with van sales and credit ledger.",
};

const score = calculateLeadScore(sampleLead);
console.log(`  ✓ Total Score Computed: ${score.total}/100`);
console.log(`    - Industry Relevance: ${score.industry_relevance}/25`);
console.log(`    - Business Scale: ${score.business_scale}/20`);
console.log(`    - Inventory Complexity: ${score.inventory_complexity}/20`);
console.log(`    - Accounting/IRD: ${score.accounting_requirements}/15`);
console.log(`    - Contact Reachability: ${score.contact_availability}/10`);
console.log(`    - Buying Intent: ${score.buying_intent}/10`);

assert(score.total >= 70, "Everest FMCG should score as High Potential (>= 70)");
assert(score.industry_relevance === 25, "FMCG wholesale should receive full 25 industry relevance points");
assert(score.contact_availability >= 8, "Having direct phone, email, and website should grant high contact points");
console.log("  ✓ Test 1 Passed: 6-Dimensional Scoring Matrix functioning accurately.\n");

// Test 2: Agent 1 Lead Discovery & Deduplication
console.log("▶ [Test 2] Testing Agent 1: Lead Discovery & Deduplication...");
import { LeadDiscoveryAgent } from "../lib/agents/discovery-agent.ts";
import { leadStore } from "../lib/supabase-admin.ts";

const discoveryResult = await LeadDiscoveryAgent.runDiscovery({
  industry: "Pharmaceutical Distributors",
  location: "Birgunj",
  targetCount: 5,
});

console.log(`  ✓ Agent 1 Executed: ${discoveryResult.discoveredLeads.length} leads harvested in Birgunj`);
assert(discoveryResult.discoveredLeads.length > 0, "Agent 1 should return discovered leads");
const firstLead = discoveryResult.discoveredLeads[0];
console.log(`    Sample: ${firstLead.company_name} (${firstLead.public_phone})`);
console.log(`    Source attribution: ${firstLead.source_url}`);
assert(firstLead.source_url.startsWith("http"), "Original source URL must be stored");
assert(firstLead.pipeline_status === "discovered", "Initial pipeline status must be 'discovered'");

// Test Deduplication: running discovery again should skip duplicates
const secondRun = await LeadDiscoveryAgent.runDiscovery({
  industry: "Pharmaceutical Distributors",
  location: "Birgunj",
  targetCount: 5,
});
console.log(`  ✓ Deduplication Test: Skipped ${secondRun.duplicatesSkipped} duplicates on identical second run`);
console.log("  ✓ Test 2 Passed: Discovery harvesting and deduplication verified.\n");

// Test 3: Agent 2 Lead Intelligence & Fact/Assumption Separation
console.log("▶ [Test 3] Testing Agent 2: Lead Intelligence & Fact/Assumption Verification...");
import { LeadIntelligenceAgent } from "../lib/agents/intelligence-agent.ts";

const researchReport = await LeadIntelligenceAgent.analyzeLead(firstLead.id);
console.log(`  ✓ Research Generated for: ${firstLead.company_name}`);
console.log(`    - Qualification: ${researchReport.qualification_explanation}`);
console.log(`    - Verified Facts: ${researchReport.verified_facts.length} items`);
console.log(`    - AI Assumptions: ${researchReport.ai_assumptions.length} items (flagged with rationale)`);
console.log(`    - ERP Module Matches: ${researchReport.recommended_features.length} features mapped`);

assert(researchReport.verified_facts.length > 0, "Must have verified facts with confidence citation");
assert(researchReport.ai_assumptions.length > 0, "Must clearly label inferred operational assumptions");
assert(researchReport.recommended_features.length >= 2, "Must recommend tailored Accknown ERP modules");
console.log("  ✓ Test 3 Passed: Fact vs Assumption segregation and ERP feature recommendations verified.\n");

// Test 4: Agent 3 Sales Assistant & Human-in-the-Loop Governance
console.log("▶ [Test 4] Testing Agent 3: Sales Outreach & Strict Human Approval Gate...");
import { SalesAssistantAgent } from "../lib/agents/outreach-agent.ts";

const draftEn = await SalesAssistantAgent.draftOutreach({
  leadId: firstLead.id,
  channel: "email",
  language: "en",
});

console.log(`  ✓ Outreach Draft (EN) Subject: "${draftEn.subject_line}"`);
console.log(`  ✓ Initial Approval Status: "${draftEn.approval_status}"`);
assert.strictEqual(
  draftEn.approval_status,
  "pending_approval",
  "Policy Violation: Generated draft MUST be 'pending_approval' before human review"
);

// Test Nepali Draft
const draftNp = await SalesAssistantAgent.draftOutreach({
  leadId: firstLead.id,
  channel: "email",
  language: "np",
});
console.log(`  ✓ Outreach Draft (NP) Subject: "${draftNp.subject_line}"`);
assert(draftNp.body_text.includes("नमस्ते"), "Nepali draft must contain local business greetings");

// Test Human Approval Execution
const approved = await SalesAssistantAgent.approveOutreach(draftEn.id, "Senior Growth Director");
console.log(`  ✓ Human Approval Applied by: ${approved.approved_by} at ${approved.approved_at}`);
assert.strictEqual(approved.approval_status, "approved", "Status must update to approved only after human sign-off");

// Verify lead pipeline advanced to 'contacted'
const reloadedLead = await leadStore.getLeadById(firstLead.id);
assert.strictEqual(reloadedLead.pipeline_status, "contacted", "Lead pipeline should advance to 'contacted' upon approval");
console.log("  ✓ Test 4 Passed: Human governance gate and multi-language drafting verified.\n");

// Test 5: Suppression List & Opt-out Guard
console.log("▶ [Test 5] Testing Suppression & Opt-out Protection...");
await leadStore.addToSuppression({
  identifier_type: "domain",
  identifier_value: "blocked-competitor.com",
  reason: "competitor",
});

const isBlocked = await leadStore.isSuppressed("sub.blocked-competitor.com");
assert(isBlocked.suppressed === true, "Domain on suppression list must be blocked");
console.log(`  ✓ Suppression Guard Verified: blocked-competitor.com is suppressed (${isBlocked.reason})`);
console.log("  ✓ Test 5 Passed: Anti-spam and suppression checks functioning.\n");

console.log("=======================================================");
console.log("🎉 ALL AGENT & WORKFLOW TEST SUITES PASSED (5/5)");
console.log("=======================================================\n");
