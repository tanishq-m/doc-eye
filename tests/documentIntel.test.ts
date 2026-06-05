import { describe, it, expect } from "vitest";
import { buildDocumentRows } from "@/lib/documentIntel";
import { computeScore } from "@/lib/readiness";
import type { Org } from "@/types";

function minimalOrg(): Org {
  return {
    id: "org",
    name: "Org",
    createdAt: "2026-01-01T00:00:00.000Z",
    isDemo: false,
    documents: [
      {
        id: "d1",
        title: "Guide",
        filename: "guide.md",
        content: "content",
        uploadedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    entities: [
      { id: "e1", label: "Alpha", type: "Client", docIds: ["d1"], mentions: 4 },
      { id: "e2", label: "Beta", type: "Project", docIds: ["d1"], mentions: 3 },
    ],
    relationships: [{ id: "r1", source: "e1", target: "e2", label: "owns" }],
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
  };
}

describe("documentIntel", () => {
  it("builds per-document entity and mention stats", () => {
    const rows = buildDocumentRows(minimalOrg());
    expect(rows).toHaveLength(1);
    expect(rows[0].entities).toHaveLength(2);
    expect(rows[0].totalMentions).toBe(7);
    expect(rows[0].relationshipCount).toBe(1);
    expect(rows[0].quality).toBe("medium");
  });
});
