/**
 * Proof tests: persona selection and instruction files visibly change responses.
 * These run fully offline — no Azure, no Mistral API calls.
 *
 * Stub strategy:
 *  - Default: fetch returns a realistic live answer containing sensitive data
 *    (simulates Mistral returning raw content from the indexed docs).
 *  - Error case: fetch throws, verifying local fallback activates.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { askQuestion } from "@/lib/askClient";
import type { InstructionFile, Persona, UploadedDocument } from "@/types";

// Simulates what Mistral returns from the indexed corpus — includes raw sensitive data
const LIVE_ANSWER =
  "The risk framework covers operational risks. " +
  "Employee salary bands are $80,000-$150,000. " +
  "HR stores SSN 123-45-6789 for compliance. " +
  "Contact hr@acmeconsulting.com for details.";

// Default stub: realistic live response with sources (Azure Search hit)
beforeEach(() => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        answer: LIVE_ANSWER,
        sources: [{ title: "Risk Management Standards", filename: "risk_standards.pdf" }],
        confidence: "high",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
});

const DOCS: UploadedDocument[] = [
  {
    id: "d1",
    title: "Risk Management Standards",
    filename: "risk_standards.pdf",
    content:
      "The risk management framework covers operational, regulatory, and financial risks. " +
      "Employee salary bands are $80,000-$150,000. SSN format: 123-45-6789 stored in HR system.",
    uploadedAt: "2026-01-01T00:00:00.000Z",
  },
];

const LEADERSHIP_PERSONA: Persona = {
  id: "p-leadership", orgId: "test-org", name: "Executive Summary",
  type: "leadership", description: "C-suite focused", isBuiltIn: true, responseTemplate: "executive",
};

const ENGINEER_PERSONA: Persona = {
  id: "p-engineer", orgId: "test-org", name: "Technical Deep Dive",
  type: "engineer", description: "Engineer focused", isBuiltIn: true, responseTemplate: "technical",
};

const HR_PERSONA: Persona = {
  id: "p-hr", orgId: "test-org", name: "HR & Compliance",
  type: "hr", description: "HR focused", isBuiltIn: true, responseTemplate: "detailed",
};

const INSTRUCTIONS: InstructionFile = {
  id: "inst-1", orgId: "test-org", lastEdited: "2026-06-05T00:00:00.000Z",
  content: `# Test Org Instructions

## Legal & Compliance
- Always include footer: "Source: internal knowledge base — handle per NDA"

## Sensitive Data Masking
- Mask SSN: \\d{3}-\\d{2}-\\d{4} → [SSN REDACTED]
- Mask salary: \\$[0-9,]+ → [SALARY REDACTED]

## Excluded Topics
- Project Omega`,
};

// ===========================================================================
describe("Persona selection changes responses", () => {
  it("uses live API endpoint (not mock fallback) by default", async () => {
    const result = await askQuestion("test-org", "What are the risks?", DOCS);
    expect(result.usedMockFallback).toBeFalsy();
    expect(result.answer).toContain("risk");
  });

  it("Leadership persona adds Executive Summary header + action footer", async () => {
    const result = await askQuestion("test-org", "What are the risks?", DOCS, {
      persona: LEADERSHIP_PERSONA,
    });
    expect(result.answer).toContain("Executive Summary");
    expect(result.answer).toContain("Action:");
    expect(result.usedMockFallback).toBeFalsy();
  });

  it("Engineer persona adds Technical Overview header + specs footer", async () => {
    const result = await askQuestion("test-org", "What are the risks?", DOCS, {
      persona: ENGINEER_PERSONA,
    });
    expect(result.answer).toContain("Technical Overview");
    expect(result.answer).toContain("specifications");
    expect(result.usedMockFallback).toBeFalsy();
  });

  it("HR persona adds HR & Compliance View header + compliance footer", async () => {
    const result = await askQuestion("test-org", "What are the risks?", DOCS, {
      persona: HR_PERSONA,
    });
    expect(result.answer).toContain("HR & Compliance View");
    expect(result.answer).toContain("compliance review");
    expect(result.usedMockFallback).toBeFalsy();
  });

  it("All three personas produce different answers for the same question", async () => {
    const q = "What are the risks?";
    const lead = await askQuestion("test-org", q, DOCS, { persona: LEADERSHIP_PERSONA });
    const eng  = await askQuestion("test-org", q, DOCS, { persona: ENGINEER_PERSONA });
    const hr   = await askQuestion("test-org", q, DOCS, { persona: HR_PERSONA });

    expect(lead.answer).not.toBe(eng.answer);
    expect(eng.answer).not.toBe(hr.answer);
    expect(lead.answer).not.toBe(hr.answer);
  });

  it("No persona passes live answer through unchanged (no framing headers)", async () => {
    const result = await askQuestion("test-org", "What are the risks?", DOCS);
    expect(result.answer).not.toContain("Executive Summary");
    expect(result.answer).not.toContain("Technical Overview");
    expect(result.answer).not.toContain("HR & Compliance View");
    expect(result.answer).toContain("risk"); // core answer present
  });

  it("Activates local fallback only when API call throws (network error)", async () => {
    globalThis.fetch = async () => { throw new Error("Network error"); };
    const result = await askQuestion("test-org", "Which documents mention risk?", DOCS);
    expect(result.usedMockFallback).toBe(true);
    expect(result.answer).toBeTruthy();
  });
});

// ===========================================================================
describe("Instruction file affects responses", () => {
  it("SSN is masked in live response when instructions configured", async () => {
    const result = await askQuestion("test-org", "What are the risks?", DOCS, {
      instructions: INSTRUCTIONS,
    });
    expect(result.answer).not.toMatch(/\d{3}-\d{2}-\d{4}/);
    expect(result.answer).toContain("[SSN REDACTED]");
    expect(result.usedMockFallback).toBeFalsy();
  });

  it("Salary figures are masked in live response", async () => {
    const result = await askQuestion("test-org", "What are the risks?", DOCS, {
      instructions: INSTRUCTIONS,
    });
    expect(result.answer).not.toMatch(/\$[0-9,]+/);
    expect(result.answer).toContain("[SALARY REDACTED]");
  });

  it("Legal footer is appended to every response", async () => {
    const result = await askQuestion("test-org", "What are the risks?", DOCS, {
      instructions: INSTRUCTIONS,
    });
    expect(result.answer).toContain("Source: internal knowledge base \u2014 handle per NDA");
  });

  it("Without instructions, raw sensitive data passes through unmasked", async () => {
    const result = await askQuestion("test-org", "What are the risks?", DOCS);
    expect(result.answer).toMatch(/\d{3}-\d{2}-\d{4}/);
    expect(result.answer).toMatch(/\$[0-9,]+/);
  });

  it("Persona + instructions both apply simultaneously to live answer", async () => {
    const result = await askQuestion("test-org", "What are the risks?", DOCS, {
      persona: LEADERSHIP_PERSONA,
      instructions: INSTRUCTIONS,
    });
    // Persona framing present
    expect(result.answer).toContain("Executive Summary");
    // Sensitive data masked
    expect(result.answer).not.toMatch(/\d{3}-\d{2}-\d{4}/);
    expect(result.answer).toContain("[SSN REDACTED]");
    expect(result.answer).not.toMatch(/\$[0-9,]+/);
    // Legal footer present
    expect(result.answer).toContain("Source: internal knowledge base \u2014 handle per NDA");
    // Still using live endpoint
    expect(result.usedMockFallback).toBeFalsy();
  });
});
