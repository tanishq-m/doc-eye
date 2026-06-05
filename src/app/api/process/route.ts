import { NextRequest, NextResponse } from "next/server";
import { searchDocuments } from "@/lib/search";
import { generateProcessPlan } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const description: string = body.description?.trim();
    const orgId: string = body.orgId?.trim();

    if (!description) {
      return NextResponse.json({ error: "No process description provided." }, { status: 400 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "No orgId provided." }, { status: 400 });
    }

    const docs = await searchDocuments(orgId, description, 6);
    if (docs.length === 0) {
      return NextResponse.json(
        { error: "No relevant documents found to generate a process plan." },
        { status: 404 }
      );
    }

    const plan = await generateProcessPlan(description, docs);
    return NextResponse.json(plan);
  } catch (err) {
    console.error("[process]", err);
    return NextResponse.json({ error: "Process generation failed. Check server logs." }, { status: 500 });
  }
}
