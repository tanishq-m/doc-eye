import { mockExtractFromContent } from "@/lib/entityExtractor";
import type { ExtractedGraph, UploadedDocument } from "@/types";

export interface UploadResult {
  doc: UploadedDocument;
  extracted: ExtractedGraph;
  usedMockFallback: boolean;
  /** Set when live /api/upload failed but demo mock kept the UI working (C4). */
  liveError?: string;
}

export async function uploadDocument(orgId: string, file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("orgId", orgId);

  try {
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = (await res.json()) as {
      id?: string;
      title?: string;
      filename?: string;
      content?: string;
      extracted?: ExtractedGraph;
      error?: string;
    };

    if (!res.ok) throw new Error(data.error ?? "Upload failed");

    const doc: UploadedDocument = {
      id: data.id ?? `local-${Date.now()}`,
      title: data.title ?? file.name,
      filename: data.filename ?? file.name,
      content: data.content ?? `Uploaded file: ${file.name}`,
      uploadedAt: new Date().toISOString(),
    };

    const extracted =
      data.extracted ??
      mockExtractFromContent(doc.id, doc.title, doc.content);

    return { doc, extracted, usedMockFallback: false };
  } catch (err) {
    const liveError =
      err instanceof Error ? err.message : "Upload failed — check server logs and .env.local";

    const doc: UploadedDocument = {
      id: `mock-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      filename: file.name,
      content: `Processed in offline mode for ${file.name}.`,
      uploadedAt: new Date().toISOString(),
    };
    const extracted = mockExtractFromContent(doc.id, doc.title, doc.content);
    return { doc, extracted, usedMockFallback: true, liveError };
  }
}
