import { describe, it, expect } from "vitest";
import type {
  Entity,
  Org,
  ReadinessScore,
  Relationship,
  SmartGap,
} from "@/types";

describe("domain types", () => {
  it("constructs a valid Entity", () => {
    const entity: Entity = {
      id: "e1",
      label: "Meridian Bank",
      type: "Client",
      docIds: ["d1"],
      mentions: 5,
    };
    expect(entity.type).toBe("Client");
    expect(entity.mentions).toBeGreaterThan(0);
  });

  it("constructs a valid Relationship", () => {
    const relationship: Relationship = {
      id: "r1",
      source: "e1",
      target: "e2",
      label: "sponsors",
    };
    expect(relationship.label).toBe("sponsors");
  });

  it("constructs a valid SmartGap", () => {
    const gap: SmartGap = {
      id: "g1",
      title: "Risk Mitigation Strategy",
      severity: "critical",
      narrative: "Referenced in 37 docs",
      impactedDocs: ["doc-a"],
    };
    expect(gap.severity).toBe("critical");
  });

  it("constructs a valid Org with score and history", () => {
    const score: ReadinessScore = {
      completeness: 70,
      quality: 60,
      connectivity: 80,
      metadata: 90,
      overall: 75,
    };
    const org: Org = {
      id: "org-1",
      name: "Acme",
      createdAt: new Date().toISOString(),
      isDemo: true,
      documents: [],
      entities: [],
      relationships: [],
      gaps: [],
      score,
      history: [{ at: new Date().toISOString(), overall: 75 }],
    };
    expect(org.score.overall).toBe(75);
    expect(org.history).toHaveLength(1);
  });
});
