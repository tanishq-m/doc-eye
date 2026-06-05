"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCorpusStore } from "@/store/corpus";

const KnowledgeGraph = dynamic(() => import("@/components/KnowledgeGraph"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
      Loading graph…
    </div>
  ),
});

export default function GraphPage() {
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

  return (
    <div data-testid="graph-page">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Knowledge Graph</h2>
        <p className="text-sm text-muted-foreground">
          Explore entities, relationships, and flagged knowledge gaps.
        </p>
      </div>
      <KnowledgeGraph org={org} orgId={orgId} />
    </div>
  );
}
