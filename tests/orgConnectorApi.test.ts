import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/org-connector/route";
import { NextRequest } from "next/server";

function makeRequest(orgId?: string, token?: string) {
  const url = new URL("http://localhost/api/org-connector");
  if (orgId) url.searchParams.set("orgId", orgId);
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return new NextRequest(url, { headers });
}

describe("org-connector API", () => {
  it("requires orgId", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
  });

  it("requires bearer API key", async () => {
    const res = await GET(makeRequest("org-1"));
    expect(res.status).toBe(401);
  });

  it("returns placeholder connector metadata when authenticated", async () => {
    const res = await GET(makeRequest("org-1", "doc-eye_testkey123"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orgId).toBe("org-1");
    expect(body.capabilities).toContain("documents");
  });
});
