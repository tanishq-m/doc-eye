"use client";

import { useState, useCallback } from "react";
import type { GapsResponse, KnowledgeGap } from "@/types";

export default function GapPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [accepted, setAccepted] = useState<Set<number>>(new Set());

  const runDetection = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/gaps");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data as GapsResponse);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Detection failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleExpand = (i: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const accept = useCallback(
    async (i: number, gap: KnowledgeGap) => {
      try {
        setError(null);
        const res = await fetch("/api/draft/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentName: gap.referencedDocument,
            draftContent: gap.generatedDraft,
          }),
        });
        if (!res.ok) throw new Error("Failed to accept draft");
        setAccepted((prev) => new Set(prev).add(i));
        setTimeout(runDetection, 500);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to accept draft.");
      }
    },
    [runDetection]
  );

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          onClick={runDetection}
          disabled={loading}
          className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-sm px-6 py-2 rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 transition-all font-medium shadow-lg shadow-orange-500/20"
        >
          {loading ? "Analysing…" : "🔍 Detect Gaps"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">{error}</div>
      )}

      {result && result.gaps.length === 0 && (
        <div className="text-sm text-green-300 bg-green-500/10 border border-green-500/30 px-4 py-3 rounded-lg">
          ✓ No knowledge gaps detected. All cross-references are satisfied.
        </div>
      )}

      {result && result.gaps.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-amber-300 font-medium">
            ⚠ {result.gaps.length} gap{result.gaps.length > 1 ? "s" : ""} detected
          </p>
          {result.gaps.map((gap: KnowledgeGap, i: number) => (
            <div key={i} className="border border-orange-500/30 rounded-lg p-4 bg-orange-500/10">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-orange-300">
                    Missing: &quot;{gap.referencedDocument}&quot;
                  </p>
                  <p className="text-xs text-orange-400/70 mt-0.5">
                    Referenced by: {gap.referencedBy.join(", ")}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{gap.businessImpact}</p>
                </div>
                {accepted.has(i) && (
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full shrink-0">
                    Draft Accepted
                  </span>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => toggleExpand(i)}
                  className="text-xs bg-slate-700/50 text-blue-300 px-3 py-1 rounded hover:bg-slate-700"
                >
                  {expanded.has(i) ? "Hide Draft ▲" : "View Generated Draft ▼"}
                </button>
                {!accepted.has(i) && (
                  <button
                    onClick={() => accept(i, gap)}
                    className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded hover:bg-green-500/30 ml-2"
                  >
                    Accept Draft
                  </button>
                )}
              </div>

              {expanded.has(i) && (
                <pre className="mt-3 text-xs bg-slate-900/50 border border-slate-700 rounded p-3 whitespace-pre-wrap text-slate-300 font-mono leading-relaxed">
                  {gap.generatedDraft}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
