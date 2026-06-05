"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { buildDocumentRows } from "@/lib/documentIntel";
import { useCorpusStore } from "@/store/corpus";

const QUALITY_STYLES = {
  high: "bg-emerald-500/15 text-emerald-400",
  medium: "bg-amber-500/15 text-amber-400",
  low: "bg-muted text-muted-foreground",
} as const;

export default function DocumentsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const org = useCorpusStore((s) => s.orgs[orgId]);

  const rows = useMemo(() => (org ? buildDocumentRows(org) : []), [org]);

  if (!org) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Organization not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="documents-page">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Documents
        </p>
        <p className="text-sm text-muted-foreground">
          Document insights for <span className="text-foreground font-medium">{org.name}</span> —
          extracted entities, mention depth, and per-document quality.
        </p>
      </div>

      {rows.length === 0 ? (
        <div
          className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground"
          data-testid="documents-empty-state"
        >
          <p>No documents yet. Upload files or connect an integration to populate this view.</p>
          <Link
            href={`/o/${orgId}/upload`}
            data-testid="documents-empty-cta"
            className="inline-flex mt-4 items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Upload documents
          </Link>
        </div>
      ) : (
        <div className="space-y-3" data-testid="documents-list">
          {rows.map((row) => (
            <article
              key={row.doc.id}
              data-testid={`document-row-${row.doc.id}`}
              className="rounded-xl border border-border bg-card p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{row.doc.title}</h3>
                  <p className="text-xs text-muted-foreground">{row.doc.filename}</p>
                </div>
                <span
                  className={`inline-flex self-start rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${QUALITY_STYLES[row.quality]}`}
                  data-testid={`doc-quality-${row.doc.id}`}
                >
                  {row.quality} quality
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span data-testid={`doc-mentions-${row.doc.id}`}>
                  {row.totalMentions} mention{row.totalMentions === 1 ? "" : "s"}
                </span>
                <span>{row.entities.length} entit{row.entities.length === 1 ? "y" : "ies"}</span>
                <span>{row.relationshipCount} relationship{row.relationshipCount === 1 ? "" : "s"}</span>
              </div>

              {row.entities.length > 0 ? (
                <div className="flex flex-wrap gap-2" data-testid={`doc-entities-${row.doc.id}`}>
                  {row.entities.map((entity) => (
                    <span
                      key={entity.id}
                      className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-foreground"
                    >
                      {entity.label}
                      <span className="text-muted-foreground"> · {entity.type}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No entities extracted yet.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
