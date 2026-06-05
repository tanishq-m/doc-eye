import { generateDocumentDraft } from "@/lib/ai";
import type { EntityType, KnowledgeGap, Org, SmartGap } from "@/types";

const MIN_DOCS_DEFAULT = 3;
const MIN_DOCS_LARGE_CORPUS = 2;
const LARGE_CORPUS_DOC_COUNT = 5;
const COUNTERPART_TYPES: EntityType[] = ["Risk", "Process"];
const GAP_ENTITY_TYPES: EntityType[] = [
  "Project",
  "Process",
  "Client",
  "Dependency",
  "Team",
];

const SEVERITY_ORDER: Record<SmartGap["severity"], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const draftCache = new Map<string, string>();
const draftPending = new Map<string, Promise<string>>();
const gapContentsByRef = new Map<string, string[]>();

// Patterns that indicate a cross-reference to another document
const DOC_SUFFIX =
  "(?:Procedure|Runbook|Guide|Policy|Process|Checklist|SOP|Document|Manual|Standard|Plan|Template|Protocol|Specification)";
const DOC_NAME = `([A-Za-z0-9][A-Za-z0-9 _.\\-/]{0,60}${DOC_SUFFIX})`;

const REFERENCE_PATTERNS = [
  new RegExp(`refer(?:ence|ring)?\\s+to\\s+["']?${DOC_NAME}["']?`, "gi"),
  new RegExp(`see\\s+(?:the\\s+)?["']?${DOC_NAME}["']?`, "gi"),
  new RegExp(`per\\s+(?:the\\s+)?["']?${DOC_NAME}["']?`, "gi"),
  new RegExp(`as\\s+defined\\s+in\\s+["']?${DOC_NAME}["']?`, "gi"),
  new RegExp(`follow\\s+(?:the\\s+)?["']?${DOC_NAME}["']?`, "gi"),
  new RegExp(`read\\s+(?:the\\s+)?["']?${DOC_NAME}["']?`, "gi"),
  new RegExp(`consult\\s+(?:the\\s+)?["']?${DOC_NAME}["']?`, "gi"),
  new RegExp(`check\\s+(?:the\\s+)?["']?${DOC_NAME}["']?`, "gi"),
];

function extractReferences(content: string): string[] {
  const refs = new Set<string>();
  for (const pattern of REFERENCE_PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) refs.add(match[1].trim());
    }
  }
  return Array.from(refs);
}

function getNeighborEntityTypes(org: Org, entityId: string): Set<EntityType> {
  const types = new Set<EntityType>();
  for (const rel of org.relationships) {
    let otherId: string | null = null;
    if (rel.source === entityId) otherId = rel.target;
    else if (rel.target === entityId) otherId = rel.source;
    if (!otherId) continue;
    const neighbor = org.entities.find((e) => e.id === otherId);
    if (neighbor) types.add(neighbor.type);
  }
  return types;
}

function countRiskLinkedDocs(org: Org, entity: Org["entities"][number]): number {
  const riskDocIds = new Set(
    org.entities.filter((e) => e.type === "Risk").flatMap((e) => e.docIds)
  );
  return entity.docIds.filter((id) => riskDocIds.has(id)).length;
}

function severityFor(entity: Org["entities"][number]): SmartGap["severity"] {
  const docCount = entity.docIds.length;
  const { mentions } = entity;
  if (mentions >= 20 || docCount >= 6) return "critical";
  if (mentions >= 10 || docCount >= 4) return "warning";
  return "info";
}

export function sortGapsBySeverity(gaps: SmartGap[]): SmartGap[] {
  return [...gaps].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
}

function minDocsThreshold(org: Org): number {
  return org.documents.length >= LARGE_CORPUS_DOC_COUNT
    ? MIN_DOCS_LARGE_CORPUS
    : MIN_DOCS_DEFAULT;
}

function gapIdForReference(referencedDocument: string): string {
  return `ref-${referencedDocument.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function knowledgeGapToSmartGap(gap: KnowledgeGap): SmartGap {
  const refCount = gap.referencedBy.length;
  const severity: SmartGap["severity"] =
    refCount >= 3 ? "critical" : refCount >= 2 ? "warning" : "info";

  return {
    id: gapIdForReference(gap.referencedDocument),
    title: `Missing: ${gap.referencedDocument}`,
    severity,
    narrative: gap.businessImpact,
    impactedDocs: gap.referencedBy,
  };
}

/** Cross-reference gaps from document text (no LLM). */
export function detectReferenceGaps(
  documents: { id: string; title: string; filename: string; content: string }[]
): KnowledgeGap[] {
  const knownTitles = new Set(documents.map((d) => d.title.toLowerCase()));
  const knownFilenames = new Set(
    documents.map((d) => d.filename.replace(/\.[^/.]+$/, "").toLowerCase())
  );

  const gapMap = new Map<string, { referencedBy: string[]; contents: string[] }>();

  for (const doc of documents) {
    const refs = extractReferences(doc.content);
    for (const ref of refs) {
      const normalized = ref.toLowerCase();
      const exists =
        knownTitles.has(normalized) || knownFilenames.has(normalized);
      if (!exists) {
        const existing = gapMap.get(ref) ?? { referencedBy: [], contents: [] };
        existing.referencedBy.push(doc.title);
        existing.contents.push(doc.content.slice(0, 2000));
        gapMap.set(ref, existing);
      }
    }
  }

  const gaps: KnowledgeGap[] = [];

  for (const [referencedDocument, { referencedBy, contents }] of gapMap.entries()) {
    gapContentsByRef.set(referencedDocument, contents);
    gaps.push({
      referencedDocument,
      referencedBy,
      businessImpact: `Workflow incomplete: "${referencedDocument}" is referenced in ${referencedBy.length} document(s) but does not exist in the knowledge base.`,
      generatedDraft: "",
    });
  }

  return gaps;
}

/** Sparse graph: many docs but weak entity linkage. */
export function detectConnectivityGaps(org: Org): SmartGap[] {
  const { documents, entities, relationships } = org;
  if (documents.length < 3 || entities.length < 3) return [];

  const linkRatio = relationships.length / Math.max(entities.length, 1);
  if (linkRatio >= 0.6) return [];

  return [
    {
      id: "connectivity-sparse-graph",
      title: "Sparse Knowledge Graph",
      severity: documents.length >= 5 ? "warning" : "info",
      narrative: `${documents.length} documents and ${entities.length} entities are linked by only ${relationships.length} relationships — the graph is thin, so coverage and readiness stay below full strength.`,
      impactedDocs: documents.slice(0, 4).map((d) => d.title),
    },
  ];
}

/** Merge graph, reference, and connectivity gaps; honor user-dismissed IDs. */
export function recomputeOrgGaps(org: Org): SmartGap[] {
  const dismissed = new Set(org.dismissedGapIds ?? []);
  const minDocs = minDocsThreshold(org);
  const graphGaps = computeSmartGaps(org, minDocs);
  const referenceGaps = detectReferenceGaps(org.documents).map(knowledgeGapToSmartGap);
  const connectivityGaps = detectConnectivityGaps(org);

  const byId = new Map<string, SmartGap>();
  for (const gap of [...graphGaps, ...referenceGaps, ...connectivityGaps]) {
    if (!dismissed.has(gap.id)) byId.set(gap.id, gap);
  }

  return sortGapsBySeverity(Array.from(byId.values()));
}

/** Pure, graph-based gap detection for mock orgs and unit tests. */
export function computeSmartGaps(
  org: Org,
  minDocs: number = minDocsThreshold(org)
): SmartGap[] {
  const gaps: SmartGap[] = [];

  for (const entity of org.entities) {
    if (!GAP_ENTITY_TYPES.includes(entity.type)) continue;
    if (entity.docIds.length < minDocs) continue;

    const neighbors = getNeighborEntityTypes(org, entity.id);
    const hasCounterpart = COUNTERPART_TYPES.some((t) => neighbors.has(t));
    if (hasCounterpart) continue;

    const docCount = entity.docIds.length;
    const riskDocCount = countRiskLinkedDocs(org, entity);
    const severity = severityFor(entity);
    const counterpartLabel = entity.type === "Process" ? "Risk" : "Risk/Process";

    const impactedDocs = entity.docIds
      .map((id) => org.documents.find((d) => d.id === id)?.title)
      .filter((title): title is string => Boolean(title));

    gaps.push({
      id: `computed-${entity.id}`,
      title: `${entity.label} Coverage Gap`,
      severity,
      narrative: `${entity.label} is referenced in ${entity.mentions} mentions across ${docCount} documents with ${riskDocCount} risk-linked docs — no ${counterpartLabel} counterpart in the knowledge graph.`,
      impactedDocs:
        impactedDocs.length > 0 ? impactedDocs : [`${docCount} documents`],
    });
  }

  return sortGapsBySeverity(gaps);
}

export async function getGapDraft(
  referencedDocument: string,
  contents: string[]
): Promise<string> {
  const key = referencedDocument.toLowerCase();
  const cached = draftCache.get(key);
  if (cached) return cached;

  const pending = draftPending.get(key);
  if (pending) return pending;

  const promise = generateDocumentDraft(referencedDocument, contents).then((draft) => {
    draftCache.set(key, draft);
    draftPending.delete(key);
    return draft;
  });
  draftPending.set(key, promise);
  return promise;
}

export function clearGapDraftCache(): void {
  draftCache.clear();
  draftPending.clear();
  gapContentsByRef.clear();
}

export async function detectGaps(
  documents: { id: string; title: string; filename: string; content: string }[]
): Promise<KnowledgeGap[]> {
  return detectReferenceGaps(documents);
}

/** Load draft lazily (cached). Call when the user expands or accepts a gap. */
export async function ensureGapDraft(gap: KnowledgeGap): Promise<string> {
  if (gap.generatedDraft) return gap.generatedDraft;
  const contents = gapContentsByRef.get(gap.referencedDocument) ?? [];
  const draft = await getGapDraft(gap.referencedDocument, contents);
  gap.generatedDraft = draft;
  return draft;
}
