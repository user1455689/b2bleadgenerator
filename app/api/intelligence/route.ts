import { NextRequest, NextResponse } from "next/server";
import { LeadIntelligenceAgent } from "@/lib/agents/intelligence-agent";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, forceRefresh } = body;

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const research = await LeadIntelligenceAgent.analyzeLead(leadId, !!forceRefresh);
    return NextResponse.json({
      success: true,
      research,
      score: research.score_breakdown.total,
    });
  } catch (err: any) {
    console.error("[API Intelligence Error]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to analyze lead intelligence" },
      { status: 500 }
    );
  }
}

