import type { Org, ReadinessScore, ReadinessSnapshot } from "@/types";

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function graphStats(org: Org): {
  entityCount: number;
  edgeCount: number;
  docCount: number;
  gapCount: number;
} {
  return {
    entityCount: org.entities.length,
    edgeCount: org.relationships.length,
    docCount: org.documents.length,
    gapCount: org.gaps.length,
  };
}

export function computeScore(org: Org): ReadinessScore {
  const { entityCount, edgeCount, docCount, gapCount } = graphStats(org);

  if (docCount === 0 && entityCount === 0) {
    return {
      completeness: 0,
      quality: 0,
      connectivity: 0,
      metadata: 0,
      overall: 0,
    };
  }

  const gapPenalty = Math.min(gapCount * 4, 40);
  const completeness = clamp(
    docCount > 0 ? (entityCount / Math.max(docCount * 4, 1)) * 100 - gapPenalty : 0
  );

  const avgMentions =
    entityCount > 0
      ? org.entities.reduce((sum, e) => sum + e.mentions, 0) / entityCount
      : 0;
  const quality = clamp(avgMentions * 12);

  const connectivity =
    entityCount > 1
      ? clamp((edgeCount / Math.max(entityCount * 1.5, 1)) * 100)
      : edgeCount > 0
        ? 50
        : 0;

  const docsWithMetadata =
    docCount > 0
      ? org.documents.filter((d) => d.title.trim() && d.filename.trim()).length
      : 0;
  const metadata = docCount > 0 ? clamp((docsWithMetadata / docCount) * 100) : 0;

  const overall = clamp(
    completeness * 0.3 + quality * 0.2 + connectivity * 0.3 + metadata * 0.2
  );

  return { completeness, quality, connectivity, metadata, overall };
}

export function snapshot(org: Org): ReadinessSnapshot {
  return {
    at: new Date().toISOString(),
    overall: computeScore(org).overall,
  };
}
