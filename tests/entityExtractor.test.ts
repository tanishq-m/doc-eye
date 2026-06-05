import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractEntities, mockExtractFromContent } from "@/lib/entityExtractor";

vi.mock("@/lib/ai", () => ({
  mistralChat: vi.fn(),
}));

import { mistralChat } from "@/lib/ai";

describe("entityExtractor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses valid JSON entities and relationships", async () => {
    vi.mocked(mistralChat).mockResolvedValue(
      JSON.stringify({
        entities: [
          { id: "e1", label: "Meridian Bank", type: "Client", mentions: 4 },
          { id: "e2", label: "Cloud Migration", type: "Project", mentions: 3 },
        ],
        relationships: [{ id: "r1", source: "e1", target: "e2", label: "sponsors" }],
      })
    );

    const result = await extractEntities("Meridian sponsors cloud migration.", {
      docId: "doc-1",
      title: "Sponsor Brief",
    });

    expect(result.entities).toHaveLength(2);
    expect(result.entities[0].label).toBe("Meridian Bank");
    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].label).toBe("sponsors");
  });

  it("returns deterministic mock on malformed JSON and never throws", async () => {
    vi.mocked(mistralChat).mockResolvedValue("not-json");

    await expect(
      extractEntities("Some enterprise content about risk controls.", {
        docId: "doc-2",
        title: "Risk Memo",
      })
    ).resolves.toMatchObject({
      entities: expect.arrayContaining([
        expect.objectContaining({ label: expect.any(String) }),
      ]),
    });
  });

  it("mockExtractFromContent always returns non-empty graph", () => {
    const result = mockExtractFromContent("d1", "Policy Guide", "risk compliance onboarding");
    expect(result.entities.length).toBeGreaterThan(0);
    expect(result.relationships.length).toBeGreaterThan(0);
  });
});
