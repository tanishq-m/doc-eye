"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FileText, Settings2 } from "lucide-react";
import ResponseCard from "@/components/ResponseCard";
import PersonaSelector from "@/components/PersonaSelector";
import { askQuestion } from "@/lib/askClient";
import { useCorpusStore } from "@/store/corpus";
import type { QueryResponse } from "@/types";

export default function AskPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const org = useCorpusStore((s) => s.orgs[orgId]);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [usedMockFallback, setUsedMockFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePersonaId, setActivePersonaId] = useState<string | undefined>(
    org?.defaultPersonaId ?? org?.personas?.[0]?.id
  );

  if (!org) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Organization not found.
      </div>
    );
  }

  const activePersona = org.personas?.find((p) => p.id === activePersonaId) ?? org.personas?.[0];

  const starterQuestions = [
    "What is Acme's current Net Revenue Retention and where is it documented?",
    "List the top three business metrics and top three reliability metrics we should review in leadership standup.",
    "What is our strongest argument for AI-readiness this quarter, and what should we improve next?",
    "List our open compliance concerns and recommend the highest-priority action before the next audit.",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setUsedMockFallback(false);

    try {
      const response = await askQuestion(orgId, q, org.documents, {
        orgName: org.name,
        gaps: org.gaps,
        entities: org.entities,
        persona: activePersona,
        instructions: org.instructions,
      });
      setResult(response);
      setUsedMockFallback(Boolean(response.usedMockFallback));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Question failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="ask-page">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Ask
          </p>
          <p className="text-sm text-muted-foreground">
            Grounded answers from{" "}
            <span className="text-foreground font-medium">{org.name}</span>
            &apos;s document corpus.
          </p>
        </div>
        <Link
          href={`/o/${orgId}/instructions`}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Manage response instructions"
        >
          <Settings2 className="h-3.5 w-3.5" />
          {org.instructions ? "Instructions active" : "Add instructions"}
        </Link>
      </div>

      {org.documents.length === 0 ? (
        <div
          className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground"
          data-testid="ask-empty-state"
        >
          Upload documents first to enable grounded Q&amp;A for this organization.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          {/* Persona selector */}
          {(org.personas?.length ?? 0) > 0 && (
            <PersonaSelector
              personas={org.personas ?? []}
              activePersonaId={activePersonaId}
              onSelect={setActivePersonaId}
            />
          )}

          {/* Starter chips */}
          {!result && !loading && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground" data-testid="ask-judge-hint">
                choose one prompt below, then switch persona to show response style changes.
              </p>
              <div className="flex flex-wrap gap-2">
                {starterQuestions.map((q, i) => (
                <button
                  key={q}
                  type="button"
                  data-testid={`ask-starter-${i}`}
                  onClick={() => setQuestion(q)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-left hover:bg-muted/40 transition-colors"
                >
                  <span className="block text-xs text-foreground">{q}</span>
                </button>
              ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to know?"
              data-testid="ask-input"
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              data-testid="ask-submit"
              className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Asking…" : "Ask"}
            </button>
          </form>

          {error && (
            <p className="text-sm text-red-400" data-testid="ask-error">
              {error}
            </p>
          )}

          {usedMockFallback && (
            <p className="text-xs text-amber-400" data-testid="ask-mock-fallback">
              Answered from your local knowledge base.
            </p>
          )}

          {/* Applied context badges */}
          {result && (activePersona || org.instructions) && (
            <div className="flex flex-wrap gap-1.5" data-testid="ask-context-badges">
              {activePersona && (
                <span className="rounded-full bg-accent/20 border border-accent/30 px-2 py-0.5 text-xs text-accent-foreground">
                  {activePersona.name} persona
                </span>
              )}
              {org.instructions && (
                <span className="rounded-full bg-muted/50 border border-border px-2 py-0.5 text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" aria-hidden />
                  Instructions applied
                </span>
              )}
            </div>
          )}

          {result && (
            <div data-testid="ask-response">
              <ResponseCard type="query" data={result} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
