import { NextRequest, NextResponse } from "next/server";
import { searchDocuments } from "@/lib/search";
import { generateAnswer } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question: string = body.question?.trim();
    const orgId: string = body.orgId?.trim();
    // Built by the client from persona + instruction parser — never trusted as a security boundary
    const additionalSystemPrompt: string = body.additionalSystemPrompt?.trim() ?? "";

    if (!question) {
      return NextResponse.json({ error: "No question provided." }, { status: 400 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "No orgId provided." }, { status: 400 });
    }

    const docs = await searchDocuments(orgId, question, 5);
    if (docs.length === 0) {
      return NextResponse.json({
        answer: "No relevant documents found in the knowledge base.",
        sources: [],
        confidence: "low",
      });
    }

    const response = await generateAnswer(question, docs, additionalSystemPrompt || undefined);
    return NextResponse.json(response);
  } catch (err) {
    console.error("[query]", err);
    return NextResponse.json({ error: "Query failed. Check server logs." }, { status: 500 });
  }
}
