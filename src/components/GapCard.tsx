"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Upload,
} from "lucide-react";
import type { Org, SmartGap } from "@/types";
import {
  explainGap,
  getSmartGapDraft,
  uploadGapFile,
  type GapUploadResult,
} from "@/lib/gapResolve";

const SEVERITY_STYLES: Record<
  SmartGap["severity"],
  { border: string; badge: string; icon: typeof AlertCircle }
> = {
  critical: {
    border: "border-red-500/40",
    badge: "bg-red-500/15 text-red-400",
    icon: AlertCircle,
  },
  warning: {
    border: "border-amber-500/40",
    badge: "bg-amber-500/15 text-amber-400",
    icon: AlertTriangle,
  },
  info: {
    border: "border-sky-500/40",
    badge: "bg-sky-500/15 text-sky-400",
    icon: Info,
  },
};

interface GapCardProps {
  org: Org;
  orgId: string;
  gap: SmartGap;
  onAccept: (gapId: string, draftContent?: string) => void;
  onUploadResolve: (gapId: string, result: GapUploadResult) => void;
  accepting?: boolean;
  uploading?: boolean;
}

export default function GapCard({
  org,
  orgId,
  gap,
  onAccept,
  onUploadResolve,
  accepting = false,
  uploading = false,
}: GapCardProps) {
  const style = SEVERITY_STYLES[gap.severity];
  const Icon = style.icon;
  const explanation = explainGap(gap);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const handleGenerateDraft = async () => {
    setDraftLoading(true);
    setDraftError(null);
    try {
      const text = await getSmartGapDraft(gap, org);
      setDraft(text);
    } catch {
      setDraftError("Could not generate draft. Try uploading a file instead.");
    } finally {
      setDraftLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    const result = await uploadGapFile(orgId, gap, file);
    onUploadResolve(gap.id, result);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`rounded-xl border bg-card p-5 shadow-sm ${style.border}`}
      data-testid={`gap-card-${gap.id}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${style.badge}`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {gap.severity}
              </span>
              <h3 className="text-base font-semibold text-foreground">{gap.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{gap.narrative}</p>
            {gap.impactedDocs.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Impacted: {gap.impactedDocs.slice(0, 4).join(", ")}
                {gap.impactedDocs.length > 4 ? ` +${gap.impactedDocs.length - 4} more` : ""}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              data-testid={`expand-gap-${gap.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" aria-hidden />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" aria-hidden />
                  Resolve gap
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onAccept(gap.id)}
              disabled={accepting}
              data-testid={`accept-gap-${gap.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Check className="h-4 w-4" aria-hidden />
              {accepting ? "Accepting…" : "Quick accept"}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
              data-testid={`gap-detail-${gap.id}`}
            >
              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
                <div className="space-y-2 text-sm" data-testid={`gap-explanation-${gap.id}`}>
                  <p>
                    <span className="font-medium text-foreground">What&apos;s missing: </span>
                    <span className="text-muted-foreground">{explanation.what}</span>
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Why flagged: </span>
                    <span className="text-muted-foreground">{explanation.why}</span>
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Impact: </span>
                    <span className="text-muted-foreground">{explanation.impact}</span>
                  </p>
                  {explanation.triggers.length > 0 && (
                    <p>
                      <span className="font-medium text-foreground">Triggered by: </span>
                      <span className="text-muted-foreground">
                        {explanation.triggers.join(", ")}
                      </span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateDraft}
                      disabled={draftLoading}
                      data-testid={`generate-draft-${gap.id}`}
                      className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 disabled:opacity-50"
                    >
                      {draftLoading ? "Generating draft…" : "Generate AI draft"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.md,.txt"
                      data-testid={`upload-gap-input-${gap.id}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUpload(file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      data-testid={`upload-gap-${gap.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 disabled:opacity-50"
                    >
                      <Upload className="h-3.5 w-3.5" aria-hidden />
                      {uploading ? "Uploading…" : "Upload file for this gap"}
                    </button>
                  </div>

                  {draftError && (
                    <p className="text-xs text-red-400">{draftError}</p>
                  )}

                  {draft !== null && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        DOC-EYE pulled related context together into this draft — review and
                        edit before accepting.
                      </p>
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={8}
                        data-testid={`gap-draft-${gap.id}`}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                      <button
                        type="button"
                        onClick={() => onAccept(gap.id, draft)}
                        disabled={accepting || !draft.trim()}
                        data-testid={`accept-draft-${gap.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" aria-hidden />
                        Accept edited draft
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
