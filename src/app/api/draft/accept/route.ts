import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { indexDocument } from "@/lib/search";

export async function POST(req: NextRequest) {
  try {
    const { documentName, draftContent, orgId } = await req.json();

    if (!documentName || !draftContent) {
      return NextResponse.json(
        { error: "Missing documentName or draftContent" },
        { status: 400 }
      );
    }

    if (!orgId?.trim()) {
      return NextResponse.json({ error: "No orgId provided." }, { status: 400 });
    }

    const id = uuidv4();
    const title = documentName;
    const filename = `${documentName.toLowerCase().replace(/\s+/g, "_")}.md`;

    await indexDocument(orgId.trim(), id, title, filename, draftContent);

    return NextResponse.json({
      id,
      title,
      filename,
      message: "Draft accepted and indexed.",
    });
  } catch (err) {
    console.error("[draft/accept]", err);
    return NextResponse.json(
      { error: "Failed to accept draft. Check server logs." },
      { status: 500 }
    );
  }
}
