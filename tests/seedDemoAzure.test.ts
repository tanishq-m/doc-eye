import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEMO_DOCUMENT_CONTENT } from "@/lib/demoCorpusContent";

const { indexDocumentMock } = vi.hoisted(() => ({
  indexDocumentMock: vi.fn(async () => undefined),
}));

vi.mock("@/lib/search", () => ({
  indexDocument: indexDocumentMock,
}));

describe("seedDemoOrgToAzure", () => {
  beforeEach(() => {
    indexDocumentMock.mockClear();
  });

  it("indexes all 12 demo documents for demo-acme-consulting", async () => {
    const { seedDemoOrgToAzure } = await import("@/lib/seedDemoAzure");
    const result = await seedDemoOrgToAzure();
    expect(result.orgId).toBe("demo-acme-consulting");
    expect(result.indexed).toBe(12);
    expect(indexDocumentMock).toHaveBeenCalledTimes(12);
    expect(indexDocumentMock).toHaveBeenCalledWith(
      "demo-acme-consulting",
      "acme-d3",
      "Risk Management Standards",
      "risk_standards.docx",
      DEMO_DOCUMENT_CONTENT["acme-d3"]
    );
  });
});
