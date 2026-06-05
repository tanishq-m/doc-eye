import { describe, it, expect } from "vitest";
import { computeScore, graphStats, snapshot } from "@/lib/readiness";
import type { Org } from "@/types";

function makeOrg(overrides: Partial<Org> = {}): Org {
  return {
    id: "test-org",
    name: "Test Org",
    createdAt: "2026-01-01T00:00:00.000Z",
    isDemo: false,
    documents: [],
    entities: [],
    relationships: [],
    gaps: [],
    score: { completeness: 0, quality: 0, connectivity: 0, metadata: 0, overall: 0 },
    history: [],
    ...overrides,
  };
}

describe("readiness", () => {
  it("returns zeros for an empty org", () => {
    const score = computeScore(makeOrg());
    expect(score.overall).toBe(0);
    expect(score.completeness).toBe(0);
    expect(score.connectivity).toBe(0);
  });

  it("computes graphStats from org contents", () => {
    const org = makeOrg({
      documents: [
        {
          id: "d1",
          title: "Doc",
          filename: "doc.md",
          content: "x",
          uploadedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      entities: [{ id: "e1", label: "A", type: "Client", docIds: ["d1"], mentions: 3 }],
      relationships: [{ id: "r1", source: "e1", target: "e1", label: "self" }],
      gaps: [{ id: "g1", title: "Gap", severity: "info", narrative: "n", impactedDocs: [] }],
    });
    expect(graphStats(org)).toEqual({
      entityCount: 1,
      edgeCount: 1,
      docCount: 1,
      gapCount: 1,
    });
  });

  it("increases overall score when entities and edges grow", () => {
    const base = makeOrg({
      documents: [
        {
          id: "d1",
          title: "One",
          filename: "one.md",
          content: "a",
          uploadedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      entities: [{ id: "e1", label: "A", type: "Client", docIds: ["d1"], mentions: 2 }],
      relationships: [],
    });
    const expanded = makeOrg({
      ...base,
      entities: [
        { id: "e1", label: "A", type: "Client", docIds: ["d1"], mentions: 8 },
        { id: "e2", label: "B", type: "Project", docIds: ["d1"], mentions: 6 },
      ],
      relationships: [{ id: "r1", source: "e1", target: "e2", label: "owns" }],
    });
    expect(computeScore(expanded).overall).toBeGreaterThan(computeScore(base).overall);
  });

  it("weights dimensions into overall between 0 and 100", () => {
    const org = makeOrg({
      documents: [
        {
          id: "d1",
          title: "Policy",
          filename: "policy.pdf",
          content: "content",
          uploadedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "d2",
          title: "Runbook",
          filename: "runbook.docx",
          content: "content",
          uploadedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
      entities: Array.from({ length: 8 }, (_, i) => ({
        id: `e${i}`,
        label: `Entity ${i}`,
        type: "Process" as const,
        docIds: ["d1"],
        mentions: 4 + i,
      })),
      relationships: Array.from({ length: 10 }, (_, i) => ({
        id: `r${i}`,
        source: `e${i % 8}`,
        target: `e${(i + 1) % 8}`,
        label: "relates",
      })),
      gaps: [{ id: "g1", title: "Gap", severity: "warning", narrative: "n", impactedDocs: [] }],
    });
    const score = computeScore(org);
    expect(score.overall).toBeGreaterThan(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(score.completeness).toBeLessThanOrEqual(100);
    expect(score.metadata).toBe(100);
  });

  it("creates a snapshot with current overall score", () => {
    const org = makeOrg({
      documents: [
        {
          id: "d1",
          title: "Doc",
          filename: "doc.md",
          content: "x",
          uploadedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      entities: [{ id: "e1", label: "A", type: "Team", docIds: ["d1"], mentions: 5 }],
    });
    const snap = snapshot(org);
    expect(snap.overall).toBe(computeScore(org).overall);
    expect(snap.at).toBeTruthy();
  });
});
