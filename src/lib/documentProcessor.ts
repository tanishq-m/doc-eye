import { DocumentAnalysisClient, AzureKeyCredential } from "@azure/ai-form-recognizer";
import mammoth from "mammoth";
import { env, hasDocumentIntelligence } from "@/lib/env";

async function extractWithDocumentIntelligence(buffer: Buffer): Promise<string> {
  const client = new DocumentAnalysisClient(
    env("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT"),
    new AzureKeyCredential(env("AZURE_DOCUMENT_INTELLIGENCE_KEY"))
  );

  const poller = await client.beginAnalyzeDocument("prebuilt-read", buffer);
  const result = await poller.pollUntilDone();
  return result.content ?? "";
}

async function extractFromPdfFallback(buffer: Buffer): Promise<string> {
  // Basic fallback: return a placeholder so the doc is still indexed
  return `[PDF content — ${buffer.length} bytes. Configure AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT to enable full text extraction.]`;
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  if (mimeType === "text/markdown" || filename.endsWith(".md")) {
    return buffer.toString("utf-8");
  }

  if (mimeType === "text/plain" || filename.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
    if (!hasDocumentIntelligence()) return extractFromPdfFallback(buffer);
    return extractWithDocumentIntelligence(buffer);
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimeType === "application/vnd.ms-powerpoint" ||
    filename.endsWith(".pptx") ||
    filename.endsWith(".ppt")
  ) {
    if (!hasDocumentIntelligence()) return extractFromPdfFallback(buffer);
    return extractWithDocumentIntelligence(buffer);
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

export function deriveTitle(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
}
