import { NextRequest, NextResponse } from "next/server";
import { LeadDiscoveryAgent } from "@/lib/agents/discovery-agent";
import { leadStore, checkDatabaseHealth } from "@/lib/supabase-admin";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { industry, location, targetCount } = body;

    if (!industry || !location) {
      return NextResponse.json(
        { error: "Industry and location are required fields" },
        { status: 400 }
      );
    }

    const [result, dbHealth] = await Promise.all([
      LeadDiscoveryAgent.runDiscovery({
        industry,
        location,
        targetCount: Number(targetCount) || 10,
        triggerSource: "manual",
      }),
      checkDatabaseHealth(),
    ]);

    return NextResponse.json({
      success: true,
      job: result.job,
      leads: result.discoveredLeads,
      dbHealth,
      metrics: {
        discovered: result.discoveredLeads.length,
        duplicatesSkipped: result.duplicatesSkipped,
        suppressedSkipped: result.suppressedSkipped,
      },
    });
  } catch (err: any) {
    console.error("[API Discovery Error]", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error during discovery run" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const [jobs, dbHealth] = await Promise.all([
      leadStore.getJobs(),
      checkDatabaseHealth(),
    ]);
    return NextResponse.json({ jobs, dbHealth });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

