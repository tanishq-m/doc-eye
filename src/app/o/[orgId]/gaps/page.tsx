"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import GapCard from "@/components/GapCard";
import type { GapUploadResult } from "@/lib/gapResolve";
import { sortGapsBySeverity } from "@/lib/gapDetector";
import { graphStats } from "@/lib/readiness";
import { useCorpusStore } from "@/store/corpus";

function ScoreDimension({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold tabular-nums">{value}</p>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1.5">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>
    </div>
  );
}

export default function GapsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const org = useCorpusStore((s) => s.orgs[orgId]);
  const acceptGap = useCorpusStore((s) => s.acceptGap);
  const resolveGapByUpload = useCorpusStore((s) => s.resolveGapByUpload);
  const refreshGaps = useCorpusStore((s) => s.refreshGaps);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [scoreBump, setScoreBump] = useState(0);
  const [scanning, setScanning] = useState(false);

  const docCount = org?.documents.length ?? 0;
  const isDemo = org?.isDemo ?? false;

  useEffect(() => {
    if (isDemo || docCount === 0) return;
    refreshGaps(orgId);
  }, [docCount, isDemo, orgId, refreshGaps]);

  const sortedGaps = useMemo(
    () => (org ? sortGapsBySeverity(org.gaps) : []),
    [org]
  );

  if (!org) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Organization not found.
      </div>
    );
  }

  const stats = graphStats(org);
  const score = org.score;
  const scoreBelowFull = score.overall < 85;

  const handleAccept = (gapId: string, draftContent?: string) => {
    const before = org.score.overall;
    setAcceptingId(gapId);
    acceptGap(orgId, gapId, draftContent ? { draftContent } : undefined);
    const after = useCorpusStore.getState().orgs[orgId]?.score.overall ?? before;
    setScoreBump(after - before);
    setAcceptingId(null);
  };

  const handleUploadResolve = (gapId: string, result: GapUploadResult) => {
    const before = org.score.overall;
    setUploadingId(gapId);
    resolveGapByUpload(orgId, gapId, result.doc, result.extracted);
    const after = useCorpusStore.getState().orgs[orgId]?.score.overall ?? before;
    setScoreBump(after - before);
    setUploadingId(null);
  };

  const handleRescan = () => {
    setScanning(true);
    refreshGaps(orgId);
    setScanning(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="gaps-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Knowledge Gaps
          </p>
          <p className="text-sm text-muted-foreground">
            Gaps are missing or incomplete knowledge your corpus references but does not fully
            cover. Resolve by editing an AI draft or uploading a file.
          </p>
        </div>
        <motion.div
          key={org.score.overall}
          initial={scoreBump > 0 ? { scale: 1.08, color: "var(--color-emerald-400)" } : false}
          animate={{ scale: 1 }}
          className="text-right"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Overall score</p>
          <p className="text-3xl font-semibold tabular-nums" data-testid="gaps-overall-score">
            {org.score.overall}
            <span className="text-lg text-muted-foreground font-normal"> / 100</span>
            {scoreBump > 0 && (
              <span className="ml-2 text-sm text-emerald-400 font-medium" data-testid="score-bump">
                +{scoreBump}
              </span>
            )}
          </p>
        </motion.div>
      </div>

      {!org.isDemo && org.documents.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleRescan}
            disabled={scanning}
            data-testid="gaps-rescan"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${scanning ? "animate-spin" : ""}`} aria-hidden />
            Re-scan corpus for gaps
          </button>
        </div>
      )}

      {sortedGaps.length === 0 ? (
        <div
          className="rounded-xl border border-border bg-card p-8 space-y-5"
          data-testid="gaps-empty-state"
        >
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-foreground">
              {org.documents.length === 0
                ? "Upload documents to detect gaps"
                : scoreBelowFull
                  ? "No open gaps detected — score reflects graph quality, not just missing docs"
                  : "No open gaps — knowledge graph coverage looks strong"}
            </p>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              {org.documents.length === 0
                ? "Gaps appear after you upload files. We scan for missing cross-references, thin entity coverage, and sparse graph links."
                : `We scanned ${stats.docCount} document${stats.docCount === 1 ? "" : "s"}, ${stats.entityCount} entities, and ${stats.edgeCount} relationships. Your overall score blends completeness, connectivity, and metadata — it can stay below 100 even when no explicit gap is flagged.`}
            </p>
          </div>

          {org.documents.length > 0 && scoreBelowFull && (
            <div
              className="grid sm:grid-cols-2 gap-3 pt-2"
              data-testid="gaps-score-breakdown"
            >
              <ScoreDimension
                label="Completeness"
                value={score.completeness}
                hint="Entity coverage per document, minus open gap penalty."
              />
              <ScoreDimension
                label="Connectivity"
                value={score.connectivity}
                hint="How well entities link together — sparse graphs score lower."
              />
              <ScoreDimension
                label="Quality"
                value={score.quality}
                hint="Average mention depth across entities."
              />
              <ScoreDimension
                label="Metadata"
                value={score.metadata}
                hint="Documents with usable titles and filenames."
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4" data-testid="gap-list">
          <AnimatePresence mode="popLayout">
            {sortedGaps.map((gap) => (
              <GapCard
                key={gap.id}
                org={org}
                orgId={orgId}
                gap={gap}
                onAccept={handleAccept}
                onUploadResolve={handleUploadResolve}
                accepting={acceptingId === gap.id}
                uploading={uploadingId === gap.id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
