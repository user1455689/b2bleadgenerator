import { NextRequest, NextResponse } from "next/server";
import { leadStore } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const list = await leadStore.getSuppressionList();
    return NextResponse.json({ suppressionList: list });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier_type, identifier_value, reason } = body;

    if (!identifier_type || !identifier_value) {
      return NextResponse.json(
        { error: "identifier_type and identifier_value are required" },
        { status: 400 }
      );
    }

    const created = await leadStore.addToSuppression({
      identifier_type,
      identifier_value,
      reason: reason || "do_not_contact",
    });

    return NextResponse.json({ success: true, entry: created });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

