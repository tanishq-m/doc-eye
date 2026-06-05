import {
  ENTITY_COLORS,
  GAP_COLOR,
  getNodeRelationships,
  toGraphData,
  type GraphNodeType,
} from "@/lib/graphAdapter";
import type { Org } from "@/types";

export interface LegendEntry {
  type: GraphNodeType;
  color: string;
  count: number;
}

export interface LabelledRelationship {
  direction: "out" | "in";
  label: string;
  peerLabel: string;
  peerId: string;
}

export interface NodeDetail {
  id: string;
  label: string;
  type: GraphNodeType;
  mentions?: number;
  isGap?: boolean;
  docTitles: string[];
  relationships: LabelledRelationship[];
  summary: string;
}

export interface GraphInsights {
  entityCount: number;
  relationshipCount: number;
  gapNodeCount: number;
  mostConnected: { label: string; count: number } | null;
}

const TYPE_ORDER: GraphNodeType[] = [
  "Client",
  "Project",
  "Team",
  "Process",
  "Risk",
  "Dependency",
  "Document",
  "Gap",
];

export function graphLegend(org: Org): LegendEntry[] {
  const data = toGraphData(org);
  const counts = new Map<GraphNodeType, number>();
  for (const node of data.nodes) {
    counts.set(node.type, (counts.get(node.type) ?? 0) + 1);
  }

  return TYPE_ORDER.filter((type) => (counts.get(type) ?? 0) > 0).map((type) => ({
    type,
    color: type === "Gap" ? GAP_COLOR : ENTITY_COLORS[type as keyof typeof ENTITY_COLORS],
    count: counts.get(type) ?? 0,
  }));
}

export function getNodeDetail(org: Org, nodeId: string): NodeDetail | null {
  const data = toGraphData(org);
  const node = data.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const docTitles = node.docIds
    ? org.documents.filter((d) => node.docIds!.includes(d.id)).map((d) => d.title)
    : [];

  const rels = getNodeRelationships(nodeId, data);
  const relationships: LabelledRelationship[] = [
    ...rels.outgoing.map((l) => ({
      direction: "out" as const,
      label: l.label,
      peerId: l.target,
      peerLabel: data.nodes.find((n) => n.id === l.target)?.label ?? l.target,
    })),
    ...rels.incoming.map((l) => ({
      direction: "in" as const,
      label: l.label,
      peerId: l.source,
      peerLabel: data.nodes.find((n) => n.id === l.source)?.label ?? l.source,
    })),
  ];

  const connectionCount = relationships.length;
  const docPart =
    docTitles.length > 0
      ? `appears in ${docTitles.length} document${docTitles.length === 1 ? "" : "s"}`
      : "has no linked source documents";
  const summary = node.isGap
    ? `Knowledge gap node — "${node.label}" is missing from the corpus and linked to ${connectionCount} related entit${connectionCount === 1 ? "y" : "ies"}.`
    : `${node.type} entity — ${docPart}, connected to ${connectionCount} entit${connectionCount === 1 ? "y" : "ies"}.`;

  return {
    id: node.id,
    label: node.label,
    type: node.type,
    mentions: node.mentions,
    isGap: node.isGap,
    docTitles,
    relationships,
    summary,
  };
}

export function graphInsights(org: Org): GraphInsights {
  const data = toGraphData(org);
  const gapNodeCount = data.nodes.filter((n) => n.isGap).length;

  const degree = new Map<string, number>();
  for (const link of data.links) {
    degree.set(link.source, (degree.get(link.source) ?? 0) + 1);
    degree.set(link.target, (degree.get(link.target) ?? 0) + 1);
  }

  let mostConnected: GraphInsights["mostConnected"] = null;
  for (const node of data.nodes) {
    if (node.isGap) continue;
    const count = degree.get(node.id) ?? 0;
    if (!mostConnected || count > mostConnected.count) {
      mostConnected = { label: node.label, count };
    }
  }

  return {
    entityCount: org.entities.length,
    relationshipCount: org.relationships.length,
    gapNodeCount,
    mostConnected,
  };
}

export function nodeValFromMentions(mentions?: number): number {
  const base = 4;
  if (!mentions || mentions <= 0) return base;
  return base + Math.min(mentions / 3, 12);
}

export function getNeighborIds(nodeId: string, org: Org): Set<string> {
  const data = toGraphData(org);
  const neighbors = new Set<string>([nodeId]);
  for (const link of data.links) {
    if (link.source === nodeId) neighbors.add(link.target);
    if (link.target === nodeId) neighbors.add(link.source);
  }
  return neighbors;
}

export function isSparseGraph(org: Org): boolean {
  return org.entities.length < 3 && org.documents.length < 2;
}
