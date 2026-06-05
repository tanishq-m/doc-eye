import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/ai", () => ({
  mistralChat: vi.fn(async () =>
    JSON.stringify({
      entities: [{ id: "e1", label: "Pulse Creative", type: "Client", mentions: 3 }],
      relationships: [],
    })
  ),
}));
import fs from "node:fs";
import path from "node:path";
import { extractTextFromFile } from "@/lib/documentProcessor";
import { extractEntities, mockExtractFromContent } from "@/lib/entityExtractor";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  MARKETING_FIXTURES_DIR,
  isAllowedUploadExtension,
  loadMarketingFixtureManifest,
  marketingFixturePath,
  readMarketingFixture,
} from "@/lib/marketingFixtures";

describe("marketing agency upload fixtures (Phase 5)", () => {
  const manifest = loadMarketingFixtureManifest();

  it("manifest lists exactly 10 documents for Pulse Creative Agency", () => {
    expect(manifest.orgName).toBe("Pulse Creative Agency");
    expect(manifest.documents).toHaveLength(10);
  });

  it("every fixture file exists on disk with allowed extension", () => {
    for (const doc of manifest.documents) {
      const fullPath = marketingFixturePath(doc.filename);
      expect(fs.existsSync(fullPath), `missing ${doc.filename}`).toBe(true);
      expect(isAllowedUploadExtension(doc.filename)).toBe(true);
      expect(fs.statSync(fullPath).size).toBeGreaterThan(0);
    }
  });

  it("covers all four supported upload formats", () => {
    const formats = new Set(manifest.documents.map((d) => d.format));
    expect(formats).toEqual(new Set(["markdown", "text", "docx", "pdf"]));
    expect(ALLOWED_UPLOAD_EXTENSIONS).toEqual([
      ".pdf",
      ".docx",
      ".md",
      ".txt",
      ".pptx",
      ".ppt",
    ]);
  });

  it("extracts text from markdown and plain-text fixtures", async () => {
    const md = await extractTextFromFile(
      readMarketingFixture("brand-voice-guidelines.md"),
      "text/markdown",
      "brand-voice-guidelines.md"
    );
    expect(md).toContain("Brand Voice Guidelines");

    const txt = await extractTextFromFile(
      readMarketingFixture("social-media-strategy.txt"),
      "text/plain",
      "social-media-strategy.txt"
    );
    expect(txt).toContain("SOCIAL MEDIA STRATEGY");
  });

  it("extracts text from DOCX fixtures via mammoth", async () => {
    const docx = await extractTextFromFile(
      readMarketingFixture("influencer-partnership-policy.docx"),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "influencer-partnership-policy.docx"
    );
    expect(docx.toLowerCase()).toContain("influencer");
  });

  it("entity extraction returns a graph for each text-based fixture sample", async () => {
    const samples = manifest.documents.filter((d) => d.format === "markdown" || d.format === "text");
    for (const doc of samples.slice(0, 3)) {
      const content = readMarketingFixture(doc.filename).toString("utf-8");
      const extracted = await extractEntities(content, {
        docId: `fixture-${doc.filename}`,
        title: doc.title,
      });
      expect(extracted.entities.length).toBeGreaterThan(0);
    }
  });

  it("mock extract works for every manifest title (offline upload fallback)", () => {
    for (const doc of manifest.documents) {
      const graph = mockExtractFromContent(`fixture-${doc.filename}`, doc.title, doc.category);
      expect(graph.entities.length).toBeGreaterThan(0);
    }
  });

  it("fixtures directory is stable for upload testing", () => {
    expect(MARKETING_FIXTURES_DIR).toContain("fixtures/marketing-agency");
    expect(fs.existsSync(path.join(MARKETING_FIXTURES_DIR, "manifest.json"))).toBe(true);
  });
});
