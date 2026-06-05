/**
 * Centralised environment variable access with validation.
 * Call validateServerEnv() at the top of any API route that needs Azure/Mistral.
 * Use the helpers below instead of process.env.VAR! in application code.
 */

const REQUIRED_FOR_UPLOAD = [
  "AZURE_STORAGE_CONNECTION_STRING",
  "AZURE_STORAGE_CONTAINER",
  "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT",
  "AZURE_DOCUMENT_INTELLIGENCE_KEY",
  "AZURE_OPENAI_EMBEDDING_ENDPOINT",
  "AZURE_OPENAI_EMBEDDING_API_KEY",
  "AZURE_OPENAI_EMBEDDING_DEPLOYMENT",
  "AZURE_SEARCH_ENDPOINT",
  "AZURE_SEARCH_INDEX_NAME",
  "AZURE_SEARCH_API_KEY",
] as const;

const REQUIRED_FOR_QUERY = [
  "MISTRAL_API_KEY",
  "AZURE_OPENAI_EMBEDDING_ENDPOINT",
  "AZURE_OPENAI_EMBEDDING_API_KEY",
  "AZURE_OPENAI_EMBEDDING_DEPLOYMENT",
  "AZURE_SEARCH_ENDPOINT",
  "AZURE_SEARCH_INDEX_NAME",
  "AZURE_SEARCH_API_KEY",
] as const;

type EnvVar =
  | "MISTRAL_API_KEY"
  | "AZURE_OPENAI_EMBEDDING_ENDPOINT"
  | "AZURE_OPENAI_EMBEDDING_API_KEY"
  | "AZURE_OPENAI_EMBEDDING_DEPLOYMENT"
  | "AZURE_SEARCH_ENDPOINT"
  | "AZURE_SEARCH_INDEX_NAME"
  | "AZURE_SEARCH_API_KEY"
  | "AZURE_STORAGE_CONNECTION_STRING"
  | "AZURE_STORAGE_CONTAINER"
  | "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT"
  | "AZURE_DOCUMENT_INTELLIGENCE_KEY";

export function env(name: EnvVar): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(
      `Missing environment variable: ${name}. ` +
        `Add it to .env.local (dev) or your host's environment settings (prod).`
    );
  }
  return val;
}

export function envOptional(name: EnvVar): string | undefined {
  return process.env[name] || undefined;
}

/** Returns true if all blob storage vars are set. Used for graceful fallback. */
export function hasBlobStorage(): boolean {
  return Boolean(
    process.env.AZURE_STORAGE_CONNECTION_STRING &&
      process.env.AZURE_STORAGE_CONTAINER
  );
}

/** Returns true if Azure AI Search vars are set. */
export function hasSearch(): boolean {
  return Boolean(
    process.env.AZURE_SEARCH_ENDPOINT &&
      process.env.AZURE_SEARCH_INDEX_NAME &&
      process.env.AZURE_SEARCH_API_KEY
  );
}

/** Returns true if Azure OpenAI embedding vars are set. */
export function hasEmbeddings(): boolean {
  return Boolean(
    process.env.AZURE_OPENAI_EMBEDDING_ENDPOINT &&
      process.env.AZURE_OPENAI_EMBEDDING_API_KEY &&
      process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT
  );
}

/** Returns true if Mistral API key is set. */
export function hasMistral(): boolean {
  return Boolean(process.env.MISTRAL_API_KEY);
}

/** Returns true if Azure Document Intelligence vars are set. */
export function hasDocumentIntelligence(): boolean {
  return Boolean(
    process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT &&
      process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY
  );
}

/**
 * Validate all vars needed for query endpoints.
 * Throws with a clear message on first missing var.
 */
export function validateQueryEnv(): void {
  for (const name of REQUIRED_FOR_QUERY) {
    env(name as EnvVar);
  }
}

/**
 * Validate all vars needed for upload endpoint.
 * Throws with a clear message on first missing var.
 */
export function validateUploadEnv(): void {
  for (const name of REQUIRED_FOR_UPLOAD) {
    env(name as EnvVar);
  }
}

/** Summary of configured services — shown on the Settings page. */
export function getEnvSummary(): Record<string, boolean> {
  return {
    mistral: hasMistral(),
    search: hasSearch(),
    embeddings: hasEmbeddings(),
    blobStorage: hasBlobStorage(),
    documentIntelligence: hasDocumentIntelligence(),
  };
}
