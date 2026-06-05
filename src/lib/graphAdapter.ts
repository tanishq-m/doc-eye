import type { EntityType, Org } from "@/types";

export const ENTITY_COLORS: Record<EntityType, string> = {
  Client: "#6366f1",
  Project: "#8b5cf6",
  Team: "#f59e0b",
  Process: "#22c55e",
  Risk: "#ef4444",
  Dependency: "#06b6d4",
  Document: "#94a3b8",
};

export const GAP_COLOR = "#f97316";

export type GraphNodeType = EntityType | "Gap";

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  color: string;
  group: string;
  isGap?: boolean;
  mentions?: number;
  docIds?: string[];
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function toGraphData(org: Org): GraphData {
  const nodes: GraphNode[] = org.entities.map((e) => ({
    id: e.id,
    label: e.label,
    type: e.type,
    color: ENTITY_COLORS[e.type],
    group: e.type,
    mentions: e.mentions,
    docIds: e.docIds,
  }));

  const links: GraphLink[] = org.relationships.map((r) => ({
    source: r.source,
    target: r.target,
    label: r.label,
  }));

  const docTitleToId = new Map(org.documents.map((d) => [d.title, d.id]));

  for (const gap of org.gaps) {
    const gapNodeId = `gap-${gap.id}`;
    nodes.push({
      id: gapNodeId,
      label: gap.title,
      type: "Gap",
      color: GAP_COLOR,
      group: "Gap",
      isGap: true,
    });

    const relatedEntityIds = new Set<string>();
    for (const docTitle of gap.impactedDocs) {
      const docId = docTitleToId.get(docTitle);
      if (!docId) continue;
      for (const entity of org.entities) {
        if (entity.docIds.includes(docId)) relatedEntityIds.add(entity.id);
      }
    }

    for (const entityId of relatedEntityIds) {
      links.push({
        source: gapNodeId,
        target: entityId,
        label: "missing",
      });
    }
  }

  return { nodes, links };
}

export function filterGraphData(
  data: GraphData,
  options: { activeTypes: Set<GraphNodeType>; query: string }
): GraphData {
  const q = options.query.trim().toLowerCase();
  const nodes = data.nodes.filter((n) => {
    if (!options.activeTypes.has(n.type)) return false;
    if (q && !n.label.toLowerCase().includes(q)) return false;
    return true;
  });
  const nodeIds = new Set(nodes.map((n) => n.id));
  const links = data.links.filter(
    (l) => nodeIds.has(l.source) && nodeIds.has(l.target)
  );
  return { nodes, links };
}

export function getNodeRelationships(
  nodeId: string,
  data: GraphData
): { outgoing: GraphLink[]; incoming: GraphLink[] } {
  return {
    outgoing: data.links.filter((l) => l.source === nodeId),
    incoming: data.links.filter((l) => l.target === nodeId),
  };
}
