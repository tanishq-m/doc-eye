import { describe, it, expect, vi, beforeEach } from "vitest";

const { uploadDocuments, search } = vi.hoisted(() => ({
  uploadDocuments: vi.fn().mockResolvedValue(undefined),
  search: vi.fn(),
}));

vi.hoisted(() => {
  process.env.AZURE_SEARCH_ENDPOINT = "https://test.search.windows.net";
  process.env.AZURE_SEARCH_INDEX_NAME = "test-index";
  process.env.AZURE_SEARCH_API_KEY = "test-key";
});

vi.mock("@/lib/ai", () => ({
  generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

vi.mock("@azure/search-documents", () => {
  class MockSearchClient {
    uploadDocuments = uploadDocuments;
    search = search;
  }
  class MockSearchIndexClient {
    getIndex = vi.fn().mockResolvedValue({
      name: "test-index",
      fields: [
        { name: "id" },
        { name: "orgId" },
        { name: "title" },
        { name: "filename" },
        { name: "content" },
        { name: "contentVector" },
      ],
    });
    createIndex = vi.fn().mockResolvedValue(undefined);
    createOrUpdateIndex = vi.fn().mockResolvedValue(undefined);
  }
  return {
    SearchClient: MockSearchClient,
    SearchIndexClient: MockSearchIndexClient,
    AzureKeyCredential: vi.fn(),
  };
});

import {
  buildOrgFilter,
  indexDocument,
  listAllDocuments,
  searchDocuments,
} from "@/lib/search";

describe("search orgId isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search.mockReturnValue({
      results: (async function* () {
        yield {
          document: {
            id: "1",
            title: "T",
            filename: "f.md",
            content: "c",
          },
          score: 0.9,
        };
      })(),
    });
  });

  it("buildOrgFilter escapes unsafe org ids", () => {
    expect(buildOrgFilter("demo-acme-consulting")).toBe("orgId eq 'demo-acme-consulting'");
    expect(() => buildOrgFilter("bad'id")).toThrow();
  });

  it("indexDocument writes orgId on upload", async () => {
    await indexDocument("org-a", "doc-1", "Title", "file.md", "content body");

    expect(uploadDocuments).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "doc-1",
        orgId: "org-a",
        title: "Title",
        filename: "file.md",
        content: "content body",
      }),
    ]);
  });

  it("searchDocuments filters reads by orgId", async () => {
    await searchDocuments("org-b", "risk policy", 3);

    expect(search).toHaveBeenCalledWith(
      "risk policy",
      expect.objectContaining({
        filter: "orgId eq 'org-b'",
      })
    );
  });

  it("listAllDocuments filters reads by orgId", async () => {
    await listAllDocuments("org-c");

    expect(search).toHaveBeenCalledWith(
      "*",
      expect.objectContaining({
        filter: "orgId eq 'org-c'",
      })
    );
  });
});
