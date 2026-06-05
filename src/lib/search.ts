import { SearchClient, AzureKeyCredential, SearchIndex } from "@azure/search-documents";
import { SearchIndexClient } from "@azure/search-documents";
import { generateEmbedding } from "@/lib/ai";
import { env } from "@/lib/env";

export interface DocIndexEntry {
  id: string;
  orgId: string;
  title: string;
  filename: string;
  content: string;
  contentVector: number[];
}

export function buildOrgFilter(orgId: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(orgId)) {
    throw new Error("Invalid orgId");
  }
  return `orgId eq '${orgId}'`;
}

function getClient(): SearchClient<DocIndexEntry> {
  return new SearchClient<DocIndexEntry>(
    env("AZURE_SEARCH_ENDPOINT"),
    env("AZURE_SEARCH_INDEX_NAME"),
    new AzureKeyCredential(env("AZURE_SEARCH_API_KEY"))
  );
}

function getAdminClient(): SearchIndexClient {
  return new SearchIndexClient(
    env("AZURE_SEARCH_ENDPOINT"),
    new AzureKeyCredential(env("AZURE_SEARCH_API_KEY"))
  );
}

const ORG_ID_FIELD = {
  name: "orgId",
  type: "Edm.String" as const,
  filterable: true,
  facetable: true,
};

function buildDefaultIndex(indexName: string): SearchIndex {
  return {
    name: indexName,
    fields: [
      { name: "id", type: "Edm.String", key: true, filterable: true },
      ORG_ID_FIELD,
      { name: "title", type: "Edm.String", searchable: true },
      { name: "filename", type: "Edm.String", filterable: true },
      { name: "content", type: "Edm.String", searchable: true },
      {
        name: "contentVector",
        type: "Collection(Edm.Single)",
        searchable: true,
        vectorSearchDimensions: 1536,
        vectorSearchProfileName: "default-profile",
      },
    ],
    vectorSearch: {
      algorithms: [{ name: "default-algo", kind: "hnsw" }],
      profiles: [{ name: "default-profile", algorithmConfigurationName: "default-algo" }],
    },
  };
}

/** Ensures index exists and includes filterable orgId (additive migration for Phase 5). */
export async function ensureIndexExists(): Promise<void> {
  const adminClient = getAdminClient();
  const indexName = env("AZURE_SEARCH_INDEX_NAME");

  try {
    const existing = await adminClient.getIndex(indexName);
    const hasOrgId = existing.fields?.some((field) => field.name === "orgId");
    if (!hasOrgId) {
      await adminClient.createOrUpdateIndex({
        ...existing,
        fields: [...(existing.fields ?? []), ORG_ID_FIELD],
      });
    }
    return;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status !== 404) throw err;
  }

  await adminClient.createIndex(buildDefaultIndex(indexName));
}

export async function indexDocument(
  orgId: string,
  id: string,
  title: string,
  filename: string,
  content: string
): Promise<void> {
  await ensureIndexExists();
  const client = getClient();
  const contentVector = await generateEmbedding(content.slice(0, 8000));

  await client.uploadDocuments([
    { id, orgId, title, filename, content, contentVector },
  ]);
}

export async function searchDocuments(
  orgId: string,
  query: string,
  topK = 5
): Promise<{ id: string; title: string; filename: string; content: string; score: number }[]> {
  const client = getClient();
  const queryVector = await generateEmbedding(query);

  const results = await client.search(query, {
    filter: buildOrgFilter(orgId),
    vectorSearchOptions: {
      queries: [
        {
          kind: "vector",
          vector: queryVector,
          kNearestNeighborsCount: topK,
          fields: ["contentVector"],
        },
      ],
    },
    select: ["id", "title", "filename", "content"],
    top: topK,
  });

  const docs: { id: string; title: string; filename: string; content: string; score: number }[] = [];
  for await (const result of results.results) {
    docs.push({
      id: result.document.id,
      title: result.document.title,
      filename: result.document.filename,
      content: result.document.content,
      score: result.score ?? 0,
    });
  }
  return docs;
}

export async function listAllDocuments(
  orgId: string
): Promise<{ id: string; title: string; filename: string; content: string }[]> {
  const client = getClient();
  const results = await client.search("*", {
    filter: buildOrgFilter(orgId),
    select: ["id", "title", "filename", "content"],
    top: 100,
  });

  const docs: { id: string; title: string; filename: string; content: string }[] = [];
  for await (const result of results.results) {
    docs.push(result.document);
  }
  return docs;
}
