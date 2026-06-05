"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { motion } from "framer-motion";
import { RotateCcw, Search, X } from "lucide-react";
import type { Org } from "@/types";
import {
  filterGraphData,
  toGraphData,
  type GraphNode,
  type GraphNodeType,
} from "@/lib/graphAdapter";
import {
  getNeighborIds,
  getNodeDetail,
  graphInsights,
  graphLegend,
  isSparseGraph,
  nodeValFromMentions,
} from "@/lib/graphView";

const FILTER_TYPES: GraphNodeType[] = [
  "Client",
  "Project",
  "Team",
  "Process",
  "Risk",
  "Dependency",
  "Document",
  "Gap",
];

interface KnowledgeGraphProps {
  org: Org;
  orgId?: string;
}

export default function KnowledgeGraph({ org, orgId }: KnowledgeGraphProps) {
  const fullData = useMemo(() => toGraphData(org), [org]);
  const legend = useMemo(() => graphLegend(org), [org]);
  const insights = useMemo(() => graphInsights(org), [org]);
  const sparse = isSparseGraph(org);

  const [activeTypes, setActiveTypes] = useState<Set<GraphNodeType>>(
    () => new Set(FILTER_TYPES)
  );
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [replayKey, setReplayKey] = useState(0);
  const [pulseTick, setPulseTick] = useState(0);
  const fgRef = useRef<ForceGraphMethods<GraphNode> | undefined>(undefined);

  useEffect(() => {
    const id = window.setInterval(() => setPulseTick((t) => t + 1), 80);
    return () => window.clearInterval(id);
  }, []);

  const graphData = useMemo(
    () => filterGraphData(fullData, { activeTypes, query }),
    [fullData, activeTypes, query]
  );

  const highlightIds = useMemo(() => {
    if (!hoveredId) return null;
    return getNeighborIds(hoveredId, org);
  }, [hoveredId, org]);

  const mostConnectedLabel = insights.mostConnected?.label ?? null;

  const paintNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const positioned = node as GraphNode & { x?: number; y?: number };
      const x = positioned.x ?? 0;
      const y = positioned.y ?? 0;
      const radius = Math.sqrt(nodeValFromMentions(node.mentions)) * 4;
      const isDimmed = highlightIds && !highlightIds.has(node.id);
      const alpha = isDimmed ? 0.35 : 1;

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      if (node.isGap) {
        const pulse = 1 + 0.25 * Math.sin(pulseTick * 0.15);
        ctx.beginPath();
        ctx.arc(x, y, radius * pulse + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      const showLabel =
        hoveredId === node.id || (mostConnectedLabel && node.label === mostConnectedLabel);
      if (showLabel) {
        const fontSize = Math.max(10 / globalScale, 3);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "rgba(250,250,250,0.95)";
        ctx.fillText(node.label, x, y + radius + 2 / globalScale);
      }

      ctx.globalAlpha = 1;
    },
    [highlightIds, hoveredId, mostConnectedLabel, pulseTick]
  );

  const handleReplay = () => {
    setReplayKey((k) => k + 1);
  };

  const nodeDetail = selected ? getNodeDetail(org, selected.id) : null;

  const toggleType = (type: GraphNodeType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  if (sparse) {
    return (
      <div
        className="rounded-xl border border-border bg-card p-10 text-center space-y-4"
        data-testid="graph-sparse-state"
      >
        <p className="text-foreground font-medium">Your knowledge graph is still thin.</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Upload documents or connect a source integration to extract entities and relationships.
          The graph will grow as content is ingested.
        </p>
        {orgId && (
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`/o/${orgId}/upload`}
              className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
            >
              Upload documents
            </Link>
            <Link
              href={`/o/${orgId}/integrations`}
              className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
            >
              Connect a source
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="knowledge-graph">
      <div
        className="rounded-xl border border-border bg-card px-4 py-3 flex flex-wrap gap-x-6 gap-y-2 text-sm"
        data-testid="graph-insights"
      >
        <span>
          <span className="text-muted-foreground">Entities:</span>{" "}
          <span className="font-medium text-foreground">{insights.entityCount}</span>
        </span>
        <span>
          <span className="text-muted-foreground">Relationships:</span>{" "}
          <span className="font-medium text-foreground">{insights.relationshipCount}</span>
        </span>
        <span>
          <span className="text-muted-foreground">Gap nodes:</span>{" "}
          <span className="font-medium text-foreground">{insights.gapNodeCount}</span>
        </span>
        {insights.mostConnected && (
          <span data-testid="graph-most-connected">
            <span className="text-muted-foreground">Most central:</span>{" "}
            <span className="font-medium text-foreground">
              {insights.mostConnected.label} ({insights.mostConnected.count} links)
            </span>
          </span>
        )}
      </div>

      <div className="flex gap-4 h-[calc(100vh-11rem)]">
        <aside className="w-52 shrink-0 space-y-4" data-testid="graph-filters">
          <div data-testid="graph-legend">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Legend
            </p>
            <ul className="space-y-1.5 mb-4">
              {legend.map((entry) => (
                <li
                  key={entry.type}
                  className="flex items-center justify-between gap-2 text-xs text-foreground"
                  data-testid={`legend-${entry.type}`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                      aria-hidden
                    />
                    <span className="truncate">{entry.type}</span>
                  </span>
                  <span className="text-muted-foreground tabular-nums">{entry.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Filter Types
            </p>
            <div className="flex flex-col gap-1.5">
              {FILTER_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 text-sm text-foreground cursor-pointer"
                >
                  <input
                    type="checkbox"
                    data-testid={`filter-${type}`}
                    checked={activeTypes.has(type)}
                    onChange={() => toggleType(type)}
                    className="rounded border-border accent-accent"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              data-testid="graph-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search nodes…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <p className="text-xs text-muted-foreground" data-testid="graph-node-count">
            {graphData.nodes.length} nodes · {graphData.links.length} links
          </p>
          <button
            type="button"
            data-testid="graph-replay"
            onClick={handleReplay}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/40"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Replay build
          </button>
        </aside>

        <motion.div
          className="flex-1 rounded-xl border border-border bg-card overflow-hidden relative min-w-0"
          data-testid="graph-canvas"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          key={replayKey}
        >
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeLabel="label"
            nodeVal={(n) => nodeValFromMentions((n as GraphNode).mentions)}
            nodeCanvasObjectMode={() => "replace"}
            nodeCanvasObject={(n, ctx, globalScale) =>
              paintNode(n as GraphNode, ctx, globalScale)
            }
            linkColor={(l) => {
              const source = typeof l.source === "object" ? (l.source as GraphNode).id : l.source;
              const target = typeof l.target === "object" ? (l.target as GraphNode).id : l.target;
              if (
                highlightIds &&
                (!highlightIds.has(String(source)) || !highlightIds.has(String(target)))
              ) {
                return "rgba(161,161,170,0.12)";
              }
              return "rgba(161,161,170,0.45)";
            }}
            linkDirectionalParticles={(l) => {
              const source = typeof l.source === "object" ? (l.source as GraphNode).id : l.source;
              const target = typeof l.target === "object" ? (l.target as GraphNode).id : l.target;
              if (
                highlightIds &&
                highlightIds.has(String(source)) &&
                highlightIds.has(String(target))
              ) {
                return 1;
              }
              return 0;
            }}
            linkDirectionalParticleWidth={2}
            linkDirectionalArrowLength={3}
            linkDirectionalArrowRelPos={1}
            enableNodeDrag
            onNodeClick={(n) => setSelected(n as GraphNode)}
            onNodeHover={(n) => setHoveredId(n ? (n as GraphNode).id : null)}
            onBackgroundClick={() => setSelected(null)}
            backgroundColor="transparent"
          />
        </motion.div>

        {nodeDetail && (
          <aside
            className="w-80 shrink-0 rounded-xl border border-border bg-card p-4 overflow-y-auto"
            data-testid="node-drawer"
          >
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase">{nodeDetail.type}</p>
                <h3 className="text-sm font-semibold text-foreground">{nodeDetail.label}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1 rounded hover:bg-muted/50 text-muted-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-3 leading-relaxed" data-testid="node-summary">
              {nodeDetail.summary}
            </p>

            {nodeDetail.isGap && (
              <p className="text-xs text-orange-400 mb-3 font-medium">
                Knowledge gap — missing document
              </p>
            )}

            {nodeDetail.mentions !== undefined && (
              <p className="text-xs text-muted-foreground mb-2">
                Mentions: <span className="text-foreground">{nodeDetail.mentions}</span>
              </p>
            )}

            {nodeDetail.docTitles.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Source documents</p>
                <ul className="text-xs text-foreground space-y-1">
                  {nodeDetail.docTitles.map((t) => (
                    <li key={t} className="truncate">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Relationships</p>
              <ul className="text-xs space-y-1 max-h-48 overflow-y-auto">
                {nodeDetail.relationships.map((rel, i) => (
                  <li key={`${rel.direction}-${rel.peerId}-${i}`} className="text-foreground">
                    {rel.label} → {rel.peerLabel}
                    <span className="text-muted-foreground">
                      {" "}
                      ({rel.direction === "out" ? "outgoing" : "incoming"})
                    </span>
                  </li>
                ))}
                {nodeDetail.relationships.length === 0 && (
                  <li className="text-muted-foreground">No relationships</li>
                )}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export { FILTER_TYPES };
