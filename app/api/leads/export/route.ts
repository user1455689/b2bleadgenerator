import { NextRequest, NextResponse } from "next/server";
import { leadStore } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const industry = searchParams.get("industry") || undefined;
    const city = searchParams.get("city") || undefined;
    const status = searchParams.get("status") || undefined;
    const minScore = searchParams.get("minScore") ? Number(searchParams.get("minScore")) : undefined;

    const { leads } = await leadStore.getLeads({
      industry,
      city,
      status,
      minScore,
      limit: 1000,
    });

    // Generate CSV Header
    const headers = [
      "ID",
      "Company Name",
      "Industry",
      "City",
      "District",
      "Lead Score",
      "Pipeline Status",
      "Public Phone",
      "Public Email",
      "Website",
      "Verification Status",
      "Discovered At",
      "Source URL",
    ];

    const escapeCsv = (val?: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = leads.map((l) => [
      escapeCsv(l.id),
      escapeCsv(l.company_name),
      escapeCsv(l.industry),
      escapeCsv(l.city),
      escapeCsv(l.district),
      l.lead_score,
      escapeCsv(l.pipeline_status),
      escapeCsv(l.public_phone),
      escapeCsv(l.public_email),
      escapeCsv(l.website),
      escapeCsv(l.verification_status),
      escapeCsv(l.discovered_at),
      escapeCsv(l.source_url),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="accknown-b2b-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

