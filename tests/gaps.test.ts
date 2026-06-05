import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  clearGapDraftCache,
  computeSmartGaps,
  detectConnectivityGaps,
  detectGaps,
  detectReferenceGaps,
  ensureGapDraft,
  getGapDraft,
  recomputeOrgGaps,
  sortGapsBySeverity,
} from "@/lib/gapDetector";
import { computeScore } from "@/lib/readiness";
import type { Org } from "@/types";

vi.mock("@/lib/ai", () => ({
  generateDocumentDraft: vi.fn(async (name: string) => `Draft for ${name}`),
}));

import { generateDocumentDraft } from "@/lib/ai";

function minimalOrg(overrides: Partial<Org> = {}): Org {
  return {
    id: "test-org",
    name: "Test Org",
    createdAt: "2026-01-01T00:00:00.000Z",
    isDemo: false,
    documents: [
      {
        id: "d1",
        title: "Doc A",
        filename: "a.md",
        content: "",
        uploadedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "d2",
        title: "Doc B",
        filename: "b.md",
        content: "",
        uploadedAt: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "d3",
        title: "Doc C",
        filename: "c.md",
        content: "",
        uploadedAt: "2026-01-03T00:00:00.000Z",
      },
    ],
    entities: [],
    relationships: [],
    gaps: [],
    score: computeScore({
      id: "x",
      name: "x",
      createdAt: "",
      isDemo: false,
      documents: [],
      entities: [],
      relationships: [],
      gaps: [],
      score: { completeness: 0, quality: 0, connectivity: 0, metadata: 0, overall: 0 },
      history: [],
    }),
    history: [],
    ...overrides,
  };
}

describe("computeSmartGaps", () => {
  it("returns no gap when entity has Risk/Process neighbor", () => {
    const org = minimalOrg({
      entities: [
        {
          id: "e1",
          label: "Delivery Program",
          type: "Project",
          docIds: ["d1", "d2", "d3"],
          mentions: 24,
        },
        {
          id: "e2",
          label: "Operational Risk",
          type: "Risk",
          docIds: ["d1"],
          mentions: 5,
        },
      ],
      relationships: [{ id: "r1", source: "e1", target: "e2", label: "mitigated_by" }],
    });

    const gaps = computeSmartGaps(org);
    expect(gaps.some((g) => g.id === "computed-e1")).toBe(false);
  });

  it("flags under-documented project with critical severity and quantified narrative", () => {
    const org = minimalOrg({
      entities: [
        {
          id: "e1",
          label: "Project Delivery",
          type: "Project",
          docIds: ["d1", "d2", "d3"],
          mentions: 37,
        },
      ],
    });

    const gaps = computeSmartGaps(org);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].severity).toBe("critical");
    expect(gaps[0].narrative).toContain("37 mentions");
    expect(gaps[0].narrative).toContain("3 documents");
    expect(gaps[0].narrative).toContain("0 risk-linked docs");
  });

  it("assigns warning and info severities deterministically", () => {
    const warningOrg = minimalOrg({
      entities: [
        {
          id: "w",
          label: "Mid Coverage",
          type: "Client",
          docIds: ["d1", "d2", "d3", "d2"],
          mentions: 12,
        },
      ],
    });
    const infoOrg = minimalOrg({
      entities: [
        {
          id: "i",
          label: "Light Coverage",
          type: "Dependency",
          docIds: ["d1", "d2", "d3"],
          mentions: 5,
        },
      ],
    });

    expect(computeSmartGaps(warningOrg)[0].severity).toBe("warning");
    expect(computeSmartGaps(infoOrg)[0].severity).toBe("info");
  });

  it("sorts gaps critical before warning before info", () => {
    const gaps = sortGapsBySeverity([
      {
        id: "g3",
        title: "Info",
        severity: "info",
        narrative: "n",
        impactedDocs: [],
      },
      {
        id: "g1",
        title: "Critical",
        severity: "critical",
        narrative: "n",
        impactedDocs: [],
      },
      {
        id: "g2",
        title: "Warning",
        severity: "warning",
        narrative: "n",
        impactedDocs: [],
      },
    ]);
    expect(gaps.map((g) => g.severity)).toEqual(["critical", "warning", "info"]);
  });
});

describe("recomputeOrgGaps", () => {
  it("merges reference and connectivity gaps for uploaded corpora", () => {
    const org = minimalOrg({
      documents: [
        {
          id: "d1",
          title: "Onboarding Guide",
          filename: "onboarding.md",
          content: "Please refer to the Disaster Recovery Procedure for failover steps.",
          uploadedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "d2",
          title: "Ops Manual",
          filename: "ops.md",
          content: "General operations overview.",
          uploadedAt: "2026-01-02T00:00:00.000Z",
        },
        {
          id: "d3",
          title: "Security Notes",
          filename: "security.md",
          content: "Security overview.",
          uploadedAt: "2026-01-03T00:00:00.000Z",
        },
      ],
      entities: [
        { id: "e1", label: "A", type: "Client", docIds: ["d1"], mentions: 2 },
        { id: "e2", label: "B", type: "Project", docIds: ["d2"], mentions: 2 },
        { id: "e3", label: "C", type: "Team", docIds: ["d3"], mentions: 2 },
      ],
      relationships: [],
    });

    const gaps = recomputeOrgGaps(org);
    expect(gaps.some((g) => g.id.includes("disaster-recovery"))).toBe(true);
    expect(gaps.some((g) => g.id === "connectivity-sparse-graph")).toBe(true);
  });

  it("excludes dismissed gap IDs from recomputation", () => {
    const org = minimalOrg({
      documents: [
        {
          id: "d1",
          title: "Guide",
          filename: "guide.md",
          content: "See the Business Continuity Plan for escalation.",
          uploadedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      dismissedGapIds: ["ref-business-continuity-plan"],
    });

    const gaps = recomputeOrgGaps(org);
    expect(gaps.find((g) => g.id === "ref-business-continuity-plan")).toBeUndefined();
  });
});

describe("detectReferenceGaps", () => {
  it("finds missing cross-referenced documents", () => {
    const gaps = detectReferenceGaps([
      {
        id: "1",
        title: "Ops Manual",
        filename: "ops.md",
        content: "See the Business Continuity Plan for escalation.",
      },
    ]);
    expect(gaps[0].referencedDocument).toBe("Business Continuity Plan");
  });
});

describe("detectConnectivityGaps", () => {
  it("flags sparse graphs when relationships are thin", () => {
    const org = minimalOrg({
      entities: [
        { id: "e1", label: "A", type: "Client", docIds: ["d1"], mentions: 2 },
        { id: "e2", label: "B", type: "Project", docIds: ["d2"], mentions: 2 },
        { id: "e3", label: "C", type: "Team", docIds: ["d3"], mentions: 2 },
      ],
      relationships: [],
    });
    expect(detectConnectivityGaps(org)).toHaveLength(1);
  });
});

describe("detectGaps lazy drafting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearGapDraftCache();
  });

  it("does not call LLM during detectGaps", async () => {
    const docs = [
      {
        id: "1",
        title: "Onboarding Guide",
        filename: "onboarding.md",
        content: 'Please refer to the Disaster Recovery Procedure for failover steps.',
      },
    ];

    const gaps = await detectGaps(docs);
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps[0].generatedDraft).toBe("");
    expect(generateDocumentDraft).not.toHaveBeenCalled();
  });

  it("loads draft lazily with cache on ensureGapDraft", async () => {
    const docs = [
      {
        id: "1",
        title: "Ops Manual",
        filename: "ops.md",
        content: 'See the Business Continuity Plan for escalation.',
      },
    ];

    const gaps = await detectGaps(docs);
    const draft = await ensureGapDraft(gaps[0]);
    expect(draft).toContain("Draft for");
    expect(generateDocumentDraft).toHaveBeenCalledTimes(1);

    await getGapDraft(gaps[0].referencedDocument, []);
    expect(generateDocumentDraft).toHaveBeenCalledTimes(1);
  });
});
