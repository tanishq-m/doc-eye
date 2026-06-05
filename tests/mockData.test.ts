import { describe, it, expect } from "vitest";
import { getDemoOrgIds, seedDemoOrgs } from "@/lib/mockData";
import { DEMO_DOCUMENT_CONTENT } from "@/lib/demoCorpusContent";

describe("seedDemoOrgs", () => {
  const orgs = seedDemoOrgs();

  it("returns exactly one demo org", () => {
    expect(orgs).toHaveLength(1);
    expect(orgs[0].name).toBe("Acme Consulting");
  });

  it("marks the demo org as isDemo", () => {
    for (const org of orgs) {
      expect(org.isDemo).toBe(true);
    }
  });

  it("assigns unique org ids", () => {
    const ids = orgs.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getDemoOrgIds()).toEqual(expect.arrayContaining(ids));
  });

  it.each(orgs.map((o) => [o.name, o]))("%s is demo-ready", (_name, org) => {
    expect(org.entities.length).toBeGreaterThanOrEqual(30);
    expect(org.relationships.length).toBeGreaterThanOrEqual(60);
    expect(org.documents.length).toBe(12);
    expect(org.gaps.length).toBeGreaterThanOrEqual(2);
    expect(org.aiProvider).toBe("mistral");
    expect(org.exportCredentials?.apiKey).toMatch(/^doc-eye_/);
    expect(org.history.length).toBeGreaterThanOrEqual(4);
  });

  it("uses rich document content for every demo document", () => {
    const org = orgs[0];
    for (const doc of org.documents) {
      expect(DEMO_DOCUMENT_CONTENT[doc.id]?.length).toBeGreaterThan(80);
      expect(doc.content).toBe(DEMO_DOCUMENT_CONTENT[doc.id]);
    }
  });

  it("trends history upward for the demo org", () => {
    for (const org of orgs) {
      const values = org.history.map((h) => h.overall);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      }
    }
  });

  it("has no dangling relationship endpoints", () => {
    for (const org of orgs) {
      const entityIds = new Set(org.entities.map((e) => e.id));
      for (const rel of org.relationships) {
        expect(entityIds.has(rel.source)).toBe(true);
        expect(entityIds.has(rel.target)).toBe(true);
      }
    }
  });
});
