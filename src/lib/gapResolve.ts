import { generateDocumentDraft } from "@/lib/ai";
import type { ExtractedGraph, Org, SmartGap, UploadedDocument } from "@/types";

export interface GapExplanation {
  what: string;
  why: string;
  impact: string;
  triggers: string[];
}

export function explainGap(gap: SmartGap): GapExplanation {
  const severityWhy: Record<SmartGap["severity"], string> = {
    critical:
      "this topic is referenced widely across the corpus but has no dedicated risk or process counterpart to govern it.",
    warning:
      "related documents mention this topic repeatedly, but supporting coverage is incomplete or fragmented.",
    info:
      "this is a smaller coverage hole that could still confuse readers or break downstream workflows.",
  };

  return {
    what: `The knowledge base is missing clear, authoritative coverage for "${gap.title}".`,
    why: `Flagged as ${gap.severity} because ${severityWhy[gap.severity]}`,
    impact: gap.narrative,
    triggers: gap.impactedDocs,
  };
}

export async function getSmartGapDraft(gap: SmartGap, org: Org): Promise<string> {
  if (gap.draft?.trim()) return gap.draft;

  const snippets = org.documents
    .filter((d) => gap.impactedDocs.includes(d.title))
    .map((d) => `Context from "${d.title}": references ${gap.title} but no standalone guide exists.`);

  const fallback = [
    `# ${gap.title}`,
    "",
    gap.narrative,
    "",
    "## Suggested coverage",
    `- Define scope and ownership for ${gap.title}`,
    `- Link impacted documents: ${gap.impactedDocs.join(", ") || "related corpus"}`,
    `- Add risk/process controls where applicable`,
  ].join("\n");

  if (snippets.length === 0) return fallback;

  try {
    return await generateDocumentDraft(gap.title, snippets);
  } catch {
    return fallback;
  }
}

function mockExtractForGap(gap: SmartGap, file: File): ExtractedGraph {
  const stem = file.name.replace(/\.[^/.]+$/, "");
  const entityId = `upload-${gap.id}-${stem}`;
  return {
    entities: [
      {
        id: entityId,
        label: gap.title,
        type: "Document",
        docIds: [],
        mentions: 2,
      },
    ],
    relationships: [],
  };
}

export interface GapUploadResult {
  doc: UploadedDocument;
  extracted: ExtractedGraph;
}

export async function uploadGapFile(
  orgId: string,
  gap: SmartGap,
  file: File
): Promise<GapUploadResult> {
  const doc: UploadedDocument = {
    id: `gap-upload-${gap.id}-${Date.now()}`,
    title: gap.title,
    filename: file.name,
    content: `Uploaded to close gap: ${gap.title}`,
    uploadedAt: new Date().toISOString(),
  };

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("orgId", orgId);
    formData.append("gapId", gap.id);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");

    const data = (await res.json()) as {
      id?: string;
      title?: string;
      filename?: string;
      content?: string;
      extracted?: ExtractedGraph;
    };

    const resolvedDoc = {
      ...doc,
      id: data.id ?? doc.id,
      title: data.title ?? doc.title,
      filename: data.filename ?? doc.filename,
      content: data.content ?? doc.content,
    };
    const extracted = data.extracted ?? mockExtractForGap(gap, file);
    for (const entity of extracted.entities) {
      entity.docIds = [resolvedDoc.id];
    }

    return { doc: resolvedDoc, extracted };
  } catch {
    const extracted = mockExtractForGap(gap, file);
    if (extracted.entities[0]) {
      extracted.entities[0].docIds = [doc.id];
    }
    return { doc, extracted };
  }
}
