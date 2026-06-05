import { mistralChat } from "@/lib/ai";
import type { Entity, EntityType, ExtractedGraph, Relationship } from "@/types";

const ENTITY_TYPES: EntityType[] = [
  "Client",
  "Project",
  "Team",
  "Process",
  "Risk",
  "Dependency",
  "Document",
];

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}

function normalizeEntities(raw: unknown, docId: string): Entity[] {
  if (!Array.isArray(raw)) return [];
  const entities: Entity[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const label = String(row.label ?? row.name ?? "").trim();
    const type = String(row.type ?? "Document") as EntityType;
    if (!label) continue;
    if (!ENTITY_TYPES.includes(type)) continue;
    const id = String(row.id ?? `ext-${slugify(label)}-${docId}`);
    entities.push({
      id,
      label,
      type,
      docIds: [docId],
      mentions: Number(row.mentions ?? 2) || 2,
    });
  }
  return entities;
}

function normalizeRelationships(raw: unknown, entities: Entity[]): Relationship[] {
  if (!Array.isArray(raw)) return [];
  const byLabel = new Map(entities.map((e) => [e.label.toLowerCase(), e.id]));
  const relationships: Relationship[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const source =
      String(row.source ?? row.sourceId ?? row.from ?? "") ||
      byLabel.get(String(row.sourceLabel ?? "").toLowerCase()) ||
      "";
    const target =
      String(row.target ?? row.targetId ?? row.to ?? "") ||
      byLabel.get(String(row.targetLabel ?? "").toLowerCase()) ||
      "";
    const label = String(row.label ?? row.type ?? "related_to").trim();
    if (!source || !target || source === target) continue;
    relationships.push({
      id: String(row.id ?? `rel-${source}-${target}-${relationships.length}`),
      source,
      target,
      label,
    });
  }
  return relationships;
}

export function mockExtractFromContent(
  docId: string,
  title: string,
  content: string
): ExtractedGraph {
  const stem = slugify(title);
  const primary: Entity = {
    id: `mock-${stem}-primary`,
    label: title,
    type: "Document",
    docIds: [docId],
    mentions: 3,
  };
  const topic = content.split(/\s+/).slice(0, 3).join(" ") || title;
  const secondary: Entity = {
    id: `mock-${stem}-topic`,
    label: topic.slice(0, 48) || "Referenced Topic",
    type: "Process",
    docIds: [docId],
    mentions: 2,
  };
  return {
    entities: [primary, secondary],
    relationships: [
      {
        id: `mock-rel-${stem}`,
        source: primary.id,
        target: secondary.id,
        label: "describes",
      },
    ],
  };
}

export async function extractEntities(
  content: string,
  options?: { docId?: string; title?: string }
): Promise<ExtractedGraph> {
  const docId = options?.docId ?? "extracted-doc";
  const title = options?.title ?? "Uploaded Document";
  const snippet = content.trim().slice(0, 12000);

  if (!snippet) {
    return mockExtractFromContent(docId, title, title);
  }

  try {
    const raw = await mistralChat(
      [
        {
          role: "system",
          content: `Extract a knowledge graph from enterprise documentation. Return ONLY valid JSON:
{
  "entities": [{ "id": "string", "label": "string", "type": "Client|Project|Team|Process|Risk|Dependency|Document", "mentions": number }],
  "relationships": [{ "id": "string", "source": "entity id", "target": "entity id", "label": "string" }]
}`,
        },
        {
          role: "user",
          content: `Document title: ${title}\n\nContent:\n${snippet}`,
        },
      ],
      { temperature: 0.2, max_tokens: 1500, response_format: { type: "json_object" } }
    );

    const parsed = JSON.parse(raw) as {
      entities?: unknown;
      relationships?: unknown;
    };
    const entities = normalizeEntities(parsed.entities, docId);
    if (entities.length === 0) {
      return mockExtractFromContent(docId, title, snippet);
    }
    const relationships = normalizeRelationships(parsed.relationships, entities);
    return { entities, relationships };
  } catch {
    return mockExtractFromContent(docId, title, snippet);
  }
}
