import { NextRequest, NextResponse } from "next/server";
import { leadStore } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const config = await leadStore.getScoringConfig();
    return NextResponse.json({ config });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await leadStore.saveScoringConfig(body);
    return NextResponse.json({ success: true, config: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

