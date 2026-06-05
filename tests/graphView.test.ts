import { describe, it, expect } from "vitest";
import { seedDemoOrgs } from "@/lib/mockData";
import {
  getNodeDetail,
  graphInsights,
  graphLegend,
  isSparseGraph,
  nodeValFromMentions,
} from "@/lib/graphView";
import type { Org } from "@/types";

describe("graphView helpers", () => {
  const org = seedDemoOrgs().find((o) => o.id === "demo-acme-consulting")!;

  it("graphLegend lists present entity types with counts", () => {
    const legend = graphLegend(org);
    expect(legend.length).toBeGreaterThan(0);
    for (const entry of legend) {
      expect(entry.count).toBeGreaterThan(0);
      expect(entry.color).toMatch(/^#/);
    }
    const client = legend.find((e) => e.type === "Client");
    expect(client?.count).toBe(org.entities.filter((e) => e.type === "Client").length);
  if (org.gaps.length > 0) {
      const gapEntry = legend.find((e) => e.type === "Gap");
      expect(gapEntry?.count).toBe(org.gaps.length);
    } else {
      expect(legend.find((e) => e.type === "Gap")).toBeUndefined();
    }
  });

  it("getNodeDetail returns docs, labelled relationships, and summary", () => {
    const entity = org.entities[0];
    const detail = getNodeDetail(org, entity.id);
    expect(detail).not.toBeNull();
    expect(detail!.type).toBe(entity.type);
    expect(detail!.docTitles.length).toBeGreaterThan(0);
    expect(detail!.summary).toContain(entity.type);
    expect(detail!.summary).toContain("connected to");
  });

  it("graphInsights returns totals and most-connected entity", () => {
    const insights = graphInsights(org);
    expect(insights.entityCount).toBe(org.entities.length);
    expect(insights.relationshipCount).toBe(org.relationships.length);
    expect(insights.gapNodeCount).toBe(org.gaps.length);
    expect(insights.mostConnected).not.toBeNull();
    expect(insights.mostConnected!.count).toBeGreaterThan(0);
  });

  it("nodeValFromMentions scales with mentions", () => {
    expect(nodeValFromMentions(1)).toBeLessThan(nodeValFromMentions(30));
    expect(nodeValFromMentions(undefined)).toBe(4);
  });

  it("isSparseGraph detects thin orgs", () => {
    const thin: Org = {
      ...org,
      entities: org.entities.slice(0, 1),
      documents: [],
      relationships: [],
    };
    expect(isSparseGraph(thin)).toBe(true);
    expect(isSparseGraph(org)).toBe(false);
  });
});
