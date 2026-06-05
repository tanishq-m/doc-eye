import { NextRequest, NextResponse } from "next/server";

/**
 * Placeholder connector endpoint for external AI agents.
 * In production this would validate the bearer token and stream org-scoped corpus data.
 */
export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId")?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  if (!orgId) {
    return NextResponse.json({ error: "orgId query parameter is required." }, { status: 400 });
  }

  if (!token.startsWith("doc-eye_")) {
    return NextResponse.json(
      {
        error: "Missing or invalid API key. Pass Authorization: Bearer <your-doc-eye-key>.",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    connector: "doc-eye",
    version: "1.0",
    orgId,
    status: "placeholder",
    message:
      "Connector authenticated. Wire this endpoint to your live org corpus in production — export JSON from the Export page for offline use today.",
    capabilities: ["documents", "entities", "relationships", "gaps", "readiness_score"],
    usage: {
      method: "GET",
      headers: { Authorization: "Bearer <api-key>" },
      exportPage: `/o/${orgId}/export`,
    },
  });
}
