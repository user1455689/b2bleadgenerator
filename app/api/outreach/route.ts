import { NextRequest, NextResponse } from "next/server";
import { SalesAssistantAgent } from "@/lib/agents/outreach-agent";
import { leadStore } from "@/lib/supabase-admin";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, channel, language, tone, campaignName } = body;

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const draft = await SalesAssistantAgent.draftOutreach({
      leadId,
      channel: channel || "email",
      language: language || "en",
      tone: tone || "consultative",
      campaignName,
    });

    return NextResponse.json({
      success: true,
      draft,
      governanceNotice: "Outreach draft generated in 'pending_approval' state. Human authorization is strictly mandated before dispatch.",
    });
  } catch (err: any) {
    console.error("[API Outreach Error]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate outreach draft" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { outreachId, action, reviewer, reason } = body;

    if (!outreachId || !action) {
      return NextResponse.json(
        { error: "outreachId and action ('approve' or 'reject') are required" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      const updated = await SalesAssistantAgent.approveOutreach(
        outreachId,
        reviewer || "Superadmin Growth Officer"
      );
      return NextResponse.json({ success: true, updated });
    } else if (action === "reject") {
      const updated = await SalesAssistantAgent.rejectOutreach(
        outreachId,
        reason || "Rejected by supervisor"
      );
      return NextResponse.json({ success: true, updated });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");

    const store = (global as any).__superadmin_store;
    let list = Array.from((store?.outreach?.values() || []) as any[]);
    if (leadId) {
      list = list.filter((o) => o.lead_id === leadId);
    }
    return NextResponse.json({ drafts: list });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

