"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, FileText, GitBranch, Layers } from "lucide-react";
import AIReadinessRadar from "@/components/AIReadinessRadar";
import ReadinessTimeline from "@/components/ReadinessTimeline";
import StatCard from "@/components/StatCard";
import { graphStats } from "@/lib/readiness";
import { useCorpusStore } from "@/store/corpus";

export default function DashboardPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const org = useCorpusStore((s) => s.orgs[orgId]);

  if (!org) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Organization not found.
      </div>
    );
  }

  const stats = graphStats(org);
  const score = org.score;

  return (
    <div className="max-w-6xl mx-auto space-y-6" data-testid="dashboard">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1
            className="text-xl font-semibold text-foreground mb-2"
            data-testid="dashboard-title"
          >
            AI Readiness Score
          </h1>
          <p className="text-5xl font-semibold tabular-nums text-foreground" data-testid="overall-score">
            {score.overall}
            <span className="text-2xl text-muted-foreground font-normal"> / 100</span>
          </p>
        </div>
        {org.history.length >= 2 && (
          <p className="text-sm text-emerald-400 font-medium">
            +{org.history.at(-1)!.overall - org.history[0]!.overall} since onboarding
          </p>
        )}
      </div>

      {stats.docCount === 0 && (
        <div
          className="flex flex-wrap gap-3"
          data-testid="dashboard-empty-cta"
        >
          <Link
            href={`/o/${orgId}/upload`}
            className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Upload documents
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
          >
            Try a demo org
          </Link>
        </div>
      )}

      {stats.gapCount > 0 && (
        <Link
          href={`/o/${orgId}/gaps`}
          className="inline-flex text-sm font-medium text-accent hover:opacity-90"
          data-testid="dashboard-gaps-cta"
        >
          Review {stats.gapCount} open gap{stats.gapCount === 1 ? "" : "s"}
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIReadinessRadar score={score} />
        <ReadinessTimeline history={org.history} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Entities" value={stats.entityCount} icon={Layers} testId="stat-entities" />
        <StatCard label="Relationships" value={stats.edgeCount} icon={GitBranch} testId="stat-relationships" />
        <StatCard label="Documents" value={stats.docCount} icon={FileText} testId="stat-documents" />
        <StatCard label="Gaps" value={stats.gapCount} icon={AlertTriangle} testId="stat-gaps" />
      </div>
    </div>
  );
}
