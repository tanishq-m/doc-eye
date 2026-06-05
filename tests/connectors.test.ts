import { describe, it, expect } from "vitest";
import {
  AI_CONNECTORS,
  SOURCE_CONNECTORS,
  getConnectorById,
  MOCK_CONNECTOR_ITEMS,
} from "@/lib/connectors";
import { ingestConnectorItems } from "@/lib/connectorIngest";

describe("connectors catalog", () => {
  it("exposes source connectors with required fields", () => {
    expect(SOURCE_CONNECTORS.length).toBeGreaterThanOrEqual(3);
    for (const connector of SOURCE_CONNECTORS) {
      expect(connector.id).toBeTruthy();
      expect(connector.name).toBeTruthy();
      expect(connector.blurb).toBeTruthy();
      expect(connector.category).toBe("source");
      expect(["available", "coming-soon"]).toContain(connector.status);
      expect(connector.icon).toBeTruthy();
    }
  });

  it("exposes AI connectors with required fields", () => {
    expect(AI_CONNECTORS.length).toBeGreaterThanOrEqual(3);
    for (const connector of AI_CONNECTORS) {
      expect(connector.category).toBe("ai");
      expect(["available", "coming-soon"]).toContain(connector.status);
    }
    expect(AI_CONNECTORS.some((c) => c.id === "mistral")).toBe(true);
  });

  it("ingestConnectorItems returns docs and extracted graph", () => {
    const items = MOCK_CONNECTOR_ITEMS.jira.slice(0, 1);
    const ingested = ingestConnectorItems("org-1", "jira", items);
    expect(ingested).toHaveLength(1);
    expect(ingested[0].doc.title).toBe(items[0].title);
    expect(ingested[0].extracted.entities.length).toBeGreaterThan(0);
  });

  it("getConnectorById resolves catalog entries", () => {
    expect(getConnectorById("jira")?.name).toBe("Jira");
    expect(getConnectorById("mistral")?.category).toBe("ai");
  });
});
