import { NextRequest, NextResponse } from "next/server";
import { listAllDocuments } from "@/lib/search";
import { detectGaps } from "@/lib/gapDetector";

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("orgId")?.trim();
    if (!orgId) {
      return NextResponse.json({ error: "No orgId provided." }, { status: 400 });
    }

    const documents = await listAllDocuments(orgId);

    if (documents.length === 0) {
      return NextResponse.json({ gaps: [] });
    }

    const gaps = await detectGaps(documents);
    return NextResponse.json({ gaps });
  } catch (err) {
    console.error("[gaps]", err);
    return NextResponse.json({ error: "Gap detection failed. Check server logs." }, { status: 500 });
  }
}
