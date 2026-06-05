import { describe, it, expect } from "vitest";
import {
  ENTITY_COLORS,
  filterGraphData,
  toGraphData,
} from "@/lib/graphAdapter";
import { seedDemoOrgs } from "@/lib/mockData";
import type { Org } from "@/types";

describe("graphAdapter", () => {
  const org = seedDemoOrgs()[0];

  it("produces nodes for all entities plus gap nodes", () => {
    const data = toGraphData(org);
    expect(data.nodes.length).toBe(org.entities.length + org.gaps.length);
  });

  it("produces links for all relationships plus gap links", () => {
    const data = toGraphData(org);
    expect(data.links.length).toBeGreaterThanOrEqual(org.relationships.length);
  });

  it("has no dangling link endpoints", () => {
    const data = toGraphData(org);
    const ids = new Set(data.nodes.map((n) => n.id));
    for (const link of data.links) {
      expect(ids.has(link.source)).toBe(true);
      expect(ids.has(link.target)).toBe(true);
    }
  });

  it("assigns colors per entity type", () => {
    const data = toGraphData(org);
    for (const node of data.nodes) {
      if (node.isGap) {
        expect(node.color).toBe("#f97316");
      } else {
        expect(node.color).toBe(ENTITY_COLORS[node.type as keyof typeof ENTITY_COLORS]);
      }
    }
  });

  it("flags gap nodes with isGap", () => {
    const data = toGraphData(org);
    const gapNodes = data.nodes.filter((n) => n.isGap);
    expect(gapNodes).toHaveLength(org.gaps.length);
    for (const g of gapNodes) {
      expect(g.id).toMatch(/^gap-/);
      expect(g.type).toBe("Gap");
    }
  });

  it("filterGraphData reduces nodes by type", () => {
    const data = toGraphData(org);
    const filtered = filterGraphData(data, {
      activeTypes: new Set(["Client"]),
      query: "",
    });
    expect(filtered.nodes.every((n) => n.type === "Client")).toBe(true);
    expect(filtered.nodes.length).toBeLessThan(data.nodes.length);
  });

  it("filterGraphData reduces nodes by search query", () => {
    const data = toGraphData(org);
    const sample = org.entities[0].label.slice(0, 4);
    const filtered = filterGraphData(data, {
      activeTypes: new Set([
        "Client",
        "Project",
        "Team",
        "Process",
        "Risk",
        "Dependency",
        "Document",
        "Gap",
      ]),
      query: sample,
    });
    expect(filtered.nodes.length).toBeGreaterThan(0);
    expect(
      filtered.nodes.every((n) => n.label.toLowerCase().includes(sample.toLowerCase()))
    ).toBe(true);
  });

  it("handles empty org", () => {
    const empty: Org = {
      ...org,
      entities: [],
      relationships: [],
      gaps: [],
    };
    const data = toGraphData(empty);
    expect(data.nodes).toHaveLength(0);
    expect(data.links).toHaveLength(0);
  });
});
