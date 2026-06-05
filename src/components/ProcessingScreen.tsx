"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

export type ProcessingStage =
  | "uploading"
  | "extracting"
  | "graphing"
  | "scoring"
  | "done"
  | "error";

const STAGES: { id: ProcessingStage; label: string }[] = [
  { id: "uploading", label: "Uploading" },
  { id: "extracting", label: "Extracting entities" },
  { id: "graphing", label: "Building graph" },
  { id: "scoring", label: "Scoring readiness" },
  { id: "done", label: "Complete" },
];

interface ProcessingScreenProps {
  stage: ProcessingStage;
  filename?: string;
  fileProgress?: { current: number; total: number };
  usedMockFallback?: boolean;
  liveError?: string;
  errorMessage?: string;
  onUploadAnother?: () => void;
  orgId?: string;
}

function stageIndex(stage: ProcessingStage): number {
  if (stage === "error") return -1;
  const idx = STAGES.findIndex((s) => s.id === stage);
  return idx >= 0 ? idx : 0;
}

export default function ProcessingScreen({
  stage,
  filename,
  fileProgress,
  usedMockFallback,
  liveError,
  errorMessage,
  onUploadAnother,
  orgId,
}: ProcessingScreenProps) {
  const isDone = stage === "done";
  const active = stageIndex(stage);

  return (
    <div
      className="rounded-xl border border-border bg-card p-8 space-y-6"
      data-testid="processing-screen"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Processing
        </p>
        <h3 className="text-lg font-semibold text-foreground">
          {filename ? `Ingesting “${filename}”` : "Preparing upload"}
        </h3>
        {fileProgress && fileProgress.total > 1 && (
          <p className="text-xs text-muted-foreground mt-1" data-testid="upload-file-progress">
            File {fileProgress.current} of {fileProgress.total}
          </p>
        )}
        {usedMockFallback && stage === "done" && (
          <div className="text-xs text-amber-400 mt-2 space-y-1" data-testid="upload-mock-fallback">
            <p>Processed in offline mode — your knowledge graph was still built.</p>
            {liveError && (
              <p className="text-amber-300/90" data-testid="upload-live-error">
                Note: {liveError}
              </p>
            )}
          </div>
        )}
        {stage === "error" && errorMessage && (
          <p className="text-sm text-red-400 mt-2">{errorMessage}</p>
        )}
      </div>

      <ol className="space-y-3" data-testid="processing-stages">
        {STAGES.map((item, index) => {
          const complete = isDone || active > index;
          const current = !isDone && stage !== "error" && active === index;
          return (
            <li
              key={item.id}
              data-testid={`stage-${item.id}`}
              className={`flex items-center gap-3 text-sm ${
                complete || current ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {complete ? (
                <Check className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden />
              ) : current ? (
                <Loader2 className="h-4 w-4 animate-spin text-accent shrink-0" aria-hidden />
              ) : (
                <span className="h-4 w-4 rounded-full border border-border shrink-0" />
              )}
              <span>{item.label}</span>
            </li>
          );
        })}
      </ol>

      {stage === "done" && (
        <div className="space-y-4">
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-emerald-400 font-medium"
            data-testid="processing-complete"
          >
            {fileProgress && fileProgress.total > 1
              ? `${fileProgress.total} documents added to your organization's knowledge graph.`
              : "Document added to your organization's knowledge graph."}
          </motion.p>
          <div className="flex flex-wrap gap-3">
            {onUploadAnother && (
              <button
                type="button"
                data-testid="upload-another"
                onClick={onUploadAnother}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
              >
                Upload more files
              </button>
            )}
            {orgId && (
              <>
                <Link
                  href={`/o/${orgId}/graph`}
                  data-testid="post-upload-graph"
                  className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
                >
                  View knowledge graph
                </Link>
                <Link
                  href={`/o/${orgId}/gaps`}
                  data-testid="post-upload-gaps"
                  className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
                >
                  See detected gaps
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {stage === "error" && (
        <p className="text-sm text-red-400" data-testid="processing-error">
          Processing failed. You can try another file.
        </p>
      )}
    </div>
  );
}
