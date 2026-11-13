import { NextRequest, NextResponse } from "next/server";
import { leadStore } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const industry = searchParams.get("industry") || undefined;
    const city = searchParams.get("city") || undefined;
    const status = searchParams.get("status") || undefined;
    const minScore = searchParams.get("minScore") ? Number(searchParams.get("minScore")) : undefined;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 25;

    const result = await leadStore.getLeads({
      search,
      industry,
      city,
      status,
      minScore,
      page,
      limit,
    });

    return NextResponse.json({
      leads: result.leads,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.company_name || !body.industry) {
      return NextResponse.json(
        { error: "company_name and industry are required" },
        { status: 400 }
      );
    }

    const saved = await leadStore.saveLead(body);
    return NextResponse.json({ success: true, lead: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

