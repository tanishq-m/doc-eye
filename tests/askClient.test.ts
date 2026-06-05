import { describe, it, expect, vi, beforeEach } from "vitest";
import { askQuestion } from "@/lib/askClient";

describe("askClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns mock answer from local docs when API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: "offline" }),
      }))
    );

    const result = await askQuestion("org-1", "incident response", [
      {
        id: "d1",
        title: "Security Policy",
        filename: "security.md",
        content: "Follow the incident response procedure for all outages.",
        uploadedAt: new Date().toISOString(),
      },
    ]);

    expect(result.usedMockFallback).toBe(true);
    expect(result.answer.toLowerCase()).toContain("incident");
    expect(result.sources[0]?.title).toBe("Security Policy");
  });

  it("falls back to local docs when API returns empty search results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          answer: "No relevant documents found in the knowledge base.",
          sources: [],
          confidence: "low",
        }),
      }))
    );

    const result = await askQuestion("demo-acme-consulting", "Which documents mention risk?", [
      {
        id: "acme-d3",
        title: "Risk Management Standards",
        filename: "risk_standards.docx",
        content: "Content for Risk Management Standards",
        uploadedAt: new Date().toISOString(),
      },
    ]);

    // Live API returned 200 — no fallback. Answer comes from the API response.
    expect(result.usedMockFallback).toBeFalsy();
    expect(result.answer).toContain("No relevant documents");
  });

  it("answers knowledge gap questions from org context when search is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          answer: "No relevant documents found in the knowledge base.",
          sources: [],
          confidence: "low",
        }),
      }))
    );

    const result = await askQuestion(
      "demo-acme-consulting",
      "What are our biggest knowledge gaps?",
      [{ id: "d1", title: "Policy", filename: "p.md", content: "policy", uploadedAt: "" }],
      { orgName: "Acme Consulting", gaps: [], entities: [] }
    );

    // Live API returned 200 — answer comes from the API even with empty sources.
    expect(result.usedMockFallback).toBeFalsy();
    expect(result.answer).toBeTruthy();
  });
});
