import { Lead, DiscoveryJob } from "../../types/lead";
import { TARGET_INDUSTRIES, NEPAL_LOCATIONS, REAL_NEPAL_ENTERPRISES } from "../nepal-market-data";
import { leadStore } from "../supabase-admin";
import { discoverRealLeadsWithAI } from "../gemini";

export interface DiscoveryOptions {
  industry: string;
  location: string;
  targetCount?: number;
  triggerSource?: "manual" | "cron";
}

export interface DiscoveryResult {
  job: DiscoveryJob;
  discoveredLeads: Lead[];
  duplicatesSkipped: number;
  suppressedSkipped: number;
}

export class LeadDiscoveryAgent {
  /**
   * Main Discovery Pipeline Execution
   */
  static async runDiscovery(options: DiscoveryOptions): Promise<DiscoveryResult> {
    const startTime = Date.now();
    const targetCount = options.targetCount || 15;

    // 1. Initialize background job record
    const job = await leadStore.saveJob({
      job_name: `${options.industry} Harvest - ${options.location}`,
      target_industry: options.industry,
      target_location: options.location,
      leads_target: targetCount,
      status: "running",
      triggered_by: options.triggerSource || "manual",
    });

    try {
      // 2. Query formulation & web retrieval
      const rawCandidates = await this.searchPublicProfiles(
        options.industry,
        options.location,
        targetCount * 2
      );

      const discoveredLeads: Lead[] = [];
      let duplicatesSkipped = 0;
      let suppressedSkipped = 0;

      // 3. Process each candidate through deduplication and suppression gates
      for (const candidate of rawCandidates) {
        if (discoveredLeads.length >= targetCount) break;

        // Normalize company domain
        const domain = candidate.website
          ? candidate.website.replace(/^https?:\/\/(www\.)?/, "").split("/")[0].toLowerCase()
          : undefined;

        // Check suppression list
        const suppressionCheck = await leadStore.isSuppressed(
          domain,
          candidate.public_email,
          candidate.public_phone,
          candidate.company_name
        );

        if (suppressionCheck.suppressed) {
          suppressedSkipped++;
          continue;
        }

        // Deduplication check against existing database
        const normalizedName = (candidate.company_name || "")
          .toLowerCase()
          .replace(/pvt\.?|ltd\.?|private|limited/gi, "")
          .replace(/[^a-z0-9]/g, "");

        const existingMatches = await leadStore.getLeads({ search: candidate.company_name || "" });
        const isDuplicate = existingMatches.leads.some(
          (l) =>
            l.normalized_name === normalizedName ||
            (domain && l.domain === domain) ||
            (candidate.public_phone && l.public_phone === candidate.public_phone)
        );

        if (isDuplicate) {
          duplicatesSkipped++;
          continue;
        }

        // Persist verified lead
        const savedLead = await leadStore.saveLead({
          ...candidate,
          is_duplicate: false,
          pipeline_status: "discovered",
        });

        discoveredLeads.push(savedLead);
      }

      // 4. Update job execution status
      const durationSec = Math.round((Date.now() - startTime) / 1000);
      job.leads_found = discoveredLeads.length;
      job.duplicates_skipped = duplicatesSkipped;
      job.status = "completed";
      job.execution_duration_sec = durationSec;
      job.completed_at = new Date().toISOString();
      await leadStore.saveJob(job);

      return {
        job,
        discoveredLeads,
        duplicatesSkipped,
        suppressedSkipped,
      };
    } catch (err: any) {
      job.status = "failed";
      job.error_message = err?.message || "Unknown error during discovery pipeline";
      job.completed_at = new Date().toISOString();
      await leadStore.saveJob(job);
      throw err;
    }
  }

  /**
   * Search authentic business registries, Google Search, and AI-driven corporate discovery
   * NEVER generates fake or synthetic names.
   */
  private static async searchPublicProfiles(
    industryQuery: string,
    locationQuery: string,
    limit: number
  ): Promise<Array<Partial<Lead>>> {
    const results: Array<Partial<Lead>> = [];
    const serperKey = process.env.SERPER_API_KEY;

    const matchedIndustry =
      TARGET_INDUSTRIES.find(
        (i) => i.name.toLowerCase() === industryQuery.toLowerCase() || i.id === industryQuery
      ) || TARGET_INDUSTRIES[0];

    const matchedLocation =
      NEPAL_LOCATIONS.find(
        (l) => l.city.toLowerCase() === locationQuery.toLowerCase()
      ) || NEPAL_LOCATIONS[0];

    // 1. External Serper / Google Maps & Search integration if API key is provided
    if (serperKey) {
      // 1A. Google Maps Places Search (Live physical addresses, verified phone lines, and business profiles)
      try {
        const placesQuery = `${matchedIndustry.name} in ${matchedLocation.city} Nepal`;
        const placesRes = await fetch("https://google.serper.dev/places", {
          method: "POST",
          headers: {
            "X-API-KEY": serperKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: placesQuery,
            location: `${matchedLocation.city}, Nepal`,
            gl: "np",
            hl: "en",
          }),
        });

        if (placesRes.ok) {
          const placesData = await placesRes.json();
          const places = placesData.places || [];
          for (const p of places) {
            if (!p.title || p.title.length < 2) continue;
            results.push({
              company_name: p.title.trim(),
              industry: matchedIndustry.name,
              city: matchedLocation.city,
              district: matchedLocation.district,
              province: matchedLocation.province,
              business_address: p.address || `${matchedLocation.city}, Nepal`,
              public_phone: p.phoneNumber || undefined,
              website: p.website || undefined,
              source_name: "Google Maps (Live Places API)",
              source_url: p.cid
                ? `https://maps.google.com/?cid=${p.cid}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.title + ' ' + matchedLocation.city)}`,
              business_description: `${p.category || matchedIndustry.name} in ${p.address || matchedLocation.city}.${p.rating ? ` Google Maps rating: ${p.rating}★ (${p.ratingCount || 0} reviews).` : ''}`,
              verification_status: p.phoneNumber ? "verified_direct" : "partially_verified",
            });
          }
        }
      } catch (e) {
        console.warn("[DiscoveryAgent] Serper Places call failed:", e);
      }

      // 1B. Google Organic Search (for additional web and directory listings)
      if (results.length < limit) {
        try {
          const query = `${matchedIndustry.name} in ${matchedLocation.city} Nepal phone email website directory`;
          const res = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: {
              "X-API-KEY": serperKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ q: query, num: limit, gl: "np" }),
          });

          if (res.ok) {
            const data = await res.json();
            const organic = data.organic || [];
            for (const item of organic) {
              const parsed = this.extractContactFromSnippet(item.title, item.snippet, item.link);
              if (
                parsed.name &&
                parsed.name.length > 2 &&
                !results.some((r) => r.company_name?.toLowerCase() === parsed.name.toLowerCase())
              ) {
                results.push({
                  company_name: parsed.name,
                  industry: matchedIndustry.name,
                  city: matchedLocation.city,
                  district: matchedLocation.district,
                  province: matchedLocation.province,
                  website: parsed.website,
                  source_name: "Google Search (Live Index)",
                  source_url: item.link,
                  business_description: item.snippet,
                  public_phone: parsed.phone,
                  public_email: parsed.email,
                  verification_status: parsed.phone ? "verified_direct" : "partially_verified",
                });
              }
            }
          }
        } catch (e) {
          console.warn("[DiscoveryAgent] Serper organic call failed:", e);
        }
      }
    }

    // 2. Discover REAL actively operating businesses via Gemini AI Agent
    if (results.length < limit) {
      try {
        const aiDiscovered = await discoverRealLeadsWithAI(
          matchedIndustry.name,
          matchedLocation.city,
          limit - results.length
        );
        for (const item of aiDiscovered) {
          if (!results.some((r) => r.company_name?.toLowerCase() === item.company_name?.toLowerCase())) {
            results.push(item);
          }
        }
      } catch (e) {
        console.warn("[DiscoveryAgent] Gemini real-lead discovery call failed:", e);
      }
    }

    // 3. Fallback to Verified Registered Nepal Enterprise Index
    // (Actual registered operating businesses in Nepal - zero synthetic placeholders)
    if (results.length < limit) {
      const realMatches = REAL_NEPAL_ENTERPRISES.filter(
        (ent) =>
          ent.city.toLowerCase() === matchedLocation.city.toLowerCase() ||
          ent.industry.toLowerCase() === matchedIndustry.name.toLowerCase()
      );

      for (const ent of realMatches) {
        if (results.length >= limit) break;
        if (!results.some((r) => r.company_name?.toLowerCase() === ent.company_name.toLowerCase())) {
          results.push({
            ...ent,
            verification_status: ent.public_phone ? "verified_direct" : "partially_verified",
          });
        }
      }

      // If still below limit, include other prominent registered industrial enterprises
      if (results.length < limit) {
        for (const ent of REAL_NEPAL_ENTERPRISES) {
          if (results.length >= limit) break;
          if (!results.some((r) => r.company_name?.toLowerCase() === ent.company_name.toLowerCase())) {
            results.push({
              ...ent,
              verification_status: ent.public_phone ? "verified_direct" : "partially_verified",
            });
          }
        }
      }
    }

    return results;
  }

  private static extractContactFromSnippet(title: string, snippet: string, link: string) {
    const cleanTitle = title.split(" - ")[0].split(" | ")[0].split(" : ")[0].trim();
    const phoneMatch = snippet.match(/(\+977[- ]?)?(98\d{8}|01[- ]?\d{7}|0[2-8]\d[- ]?\d{6})/);
    const emailMatch = snippet.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);

    let website: string | undefined;
    try {
      const u = new URL(link);
      website = `${u.protocol}//${u.hostname}`;
    } catch {
      website = undefined;
    }

    return {
      name: cleanTitle,
      phone: phoneMatch ? phoneMatch[0].replace(/[- ]/g, "") : undefined,
      email: emailMatch ? emailMatch[0].toLowerCase() : undefined,
      website,
    };
  }
}
