import OpenAI, { AzureOpenAI } from "openai";
import { SearchIndexClient, AzureKeyCredential } from "@azure/search-documents";
import { DocumentAnalysisClient, AzureKeyCredential as FormKey } from "@azure/ai-form-recognizer";
import { BlobServiceClient } from "@azure/storage-blob";
import fs from "fs";

function loadEnvFile() {
  const candidates = [".env", ".env.local"];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      console.log(`Using env file: ${file}`);
      return fs.readFileSync(file, "utf-8");
    }
  }
  throw new Error("No .env or .env.local file found.");
}

const env = {};
loadEnvFile().split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const [key, ...valueParts] = trimmed.split("=");
    env[key.trim()] = valueParts.join("=").trim();
  }
});

// Read from environment
const MISTRAL_API_KEY = env.MISTRAL_API_KEY || "";
const OPENAI_API_KEY = env.OPENAI_API_KEY || "";
const OAI_DEPLOYMENT = env.AZURE_OPENAI_DEPLOYMENT || "mistral-small-latest";
const OAI_EMBEDDING_ENDPOINT = env.AZURE_OPENAI_EMBEDDING_ENDPOINT || "";
const OAI_EMBEDDING_KEY = env.AZURE_OPENAI_EMBEDDING_API_KEY || "";
const OAI_EMBEDDING_DEPLOYMENT = env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || "text-embedding-3-small";
const SEARCH_ENDPOINT = env.AZURE_SEARCH_ENDPOINT || "";
const SEARCH_KEY = env.AZURE_SEARCH_API_KEY || "";
const DOC_ENDPOINT = env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || "";
const DOC_KEY = env.AZURE_DOCUMENT_INTELLIGENCE_KEY || "";
const STORAGE_CONNECTION_STRING = env.AZURE_STORAGE_CONNECTION_STRING || "";
const STORAGE_CONTAINER = env.AZURE_STORAGE_CONTAINER || "";

// 1. Chat (Mistral if key set, else OpenAI)
try {
  const client = MISTRAL_API_KEY
    ? new OpenAI({ apiKey: MISTRAL_API_KEY, baseURL: "https://api.mistral.ai/v1" })
    : new OpenAI({ apiKey: OPENAI_API_KEY });
  const r = await client.chat.completions.create({
    model: OAI_DEPLOYMENT,
    messages: [{ role: "user", content: "Reply with one word: OK" }],
    max_tokens: 5,
  });
  console.log("✓ OpenAI Chat:", r.choices[0].message.content?.trim());
} catch (e) {
  console.log("✗ OpenAI Chat:", e.message);
}

// 2. OpenAI Embeddings
try {
  const client = new AzureOpenAI({ endpoint: OAI_EMBEDDING_ENDPOINT, apiKey: OAI_EMBEDDING_KEY, apiVersion: "2024-10-21", deployment: OAI_EMBEDDING_DEPLOYMENT });
  const r = await client.embeddings.create({ input: "hello world", model: OAI_EMBEDDING_DEPLOYMENT });
  console.log("✓ OpenAI Embeddings: vector length", r.data[0].embedding.length);
} catch (e) {
  console.log("✗ OpenAI Embeddings:", e.message);
}

// 3. Azure AI Search (list indexes)
try {
  const admin = new SearchIndexClient(SEARCH_ENDPOINT, new AzureKeyCredential(SEARCH_KEY));
  const indexes = [];
  for await (const idx of admin.listIndexes()) indexes.push(idx.name);
  console.log("✓ Azure AI Search: indexes found:", indexes.length === 0 ? "(none yet)" : indexes.join(", "));
} catch (e) {
  console.log("✗ Azure AI Search:", e.message);
}

// 4. Azure Document Intelligence
try {
  const client = new DocumentAnalysisClient(DOC_ENDPOINT, new FormKey(DOC_KEY));
  // Analyze a trivial inline buffer to verify auth (will fail on content, not auth)
  const buf = Buffer.from("%PDF-1.4 test");
  const poller = await client.beginAnalyzeDocument("prebuilt-read", buf);
  await poller.pollUntilDone();
  console.log("✓ Document Intelligence: connected");
} catch (e) {
  // Auth errors = 401/403. Content errors = 400/InvalidContent = also means we connected fine
  if (e.message?.includes("401") || e.message?.includes("403") || e.message?.includes("Unauthorized")) {
    console.log("✗ Document Intelligence: auth failed -", e.message);
  } else {
    console.log("✓ Document Intelligence: connected (content error expected with dummy PDF):", e.message.slice(0, 80));
  }
}

// 5. Azure Blob Storage (upload + delete probe)
try {
  if (!STORAGE_CONNECTION_STRING || !STORAGE_CONTAINER) {
    throw new Error("Missing AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_CONTAINER");
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(STORAGE_CONTAINER);
  const created = await containerClient.createIfNotExists();
  const blobClient = containerClient.getBlockBlobClient("doc-eye-connectivity-test.txt");

  await blobClient.upload("ok", 2, {
    blobHTTPHeaders: { blobContentType: "text/plain" },
  });
  await blobClient.delete();

  const status = created ? "container created" : "container ready";
  console.log(`✓ Azure Blob Storage: ${status} (${STORAGE_CONTAINER})`);
} catch (e) {
  console.log("✗ Azure Blob Storage:", e.message.split("\n")[0]);
}
