import type { Entity, Org, UploadedDocument } from "@/types";

export type DocQuality = "high" | "medium" | "low";

export interface DocumentRow {
  doc: UploadedDocument;
  entities: Entity[];
  totalMentions: number;
  relationshipCount: number;
  quality: DocQuality;
}

function qualityFor(entities: Entity[], relationshipCount: number): DocQuality {
  const mentions = entities.reduce((sum, e) => sum + e.mentions, 0);
  if (entities.length >= 3 && mentions >= 8 && relationshipCount >= 2) return "high";
  if (entities.length >= 1 && mentions >= 3) return "medium";
  return "low";
}

export function buildDocumentRows(org: Org): DocumentRow[] {
  return org.documents.map((doc) => {
    const entities = org.entities.filter((e) => e.docIds.includes(doc.id));
    const entityIds = new Set(entities.map((e) => e.id));
    const relationshipCount = org.relationships.filter(
      (r) => entityIds.has(r.source) || entityIds.has(r.target)
    ).length;
    const totalMentions = entities.reduce((sum, e) => sum + e.mentions, 0);

    return {
      doc,
      entities,
      totalMentions,
      relationshipCount,
      quality: qualityFor(entities, relationshipCount),
    };
  });
}
