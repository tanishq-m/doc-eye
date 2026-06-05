"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Sparkles } from "lucide-react";
import OrgNameDialog from "@/components/OrgNameDialog";
import { getDemoOrgIds } from "@/lib/mockData";
import { useCorpusStore } from "@/store/corpus";

export default function LandingPage() {
  const router = useRouter();
  const init = useCorpusStore((s) => s.init);
  const createOrg = useCorpusStore((s) => s.createOrg);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const tryDemo = () => {
    init();
    const demoId = getDemoOrgIds()[0];
    router.push(`/o/${demoId}/dashboard`);
  };

  const handleCreateOrg = (name: string) => {
    init();
    const id = createOrg(name);
    setCreateOpen(false);
    router.push(`/o/${id}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm">
            D
          </div>
          <span className="font-semibold tracking-tight">DOC-EYE</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-3xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Data-to-AI Readiness Engine
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight" data-testid="landing-hero">
            Make your data AI-ready — then take it anywhere
          </h1>

          <p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            data-testid="landing-subhead"
          >
            Upload your documents and DOC-EYE builds an AI-ready knowledge graph for your
            organization. Use it here, or connect it to Claude, ChatGPT, Gemini, Codex, Meta AI,
            and more. Your data stays yours — portable, exportable, never locked in.
          </p>

          <div
            className="grid gap-4 sm:grid-cols-3 text-left max-w-3xl mx-auto"
            data-testid="landing-values"
          >
            <div className="rounded-xl border border-border bg-card p-5 space-y-2">
              <h2 className="text-sm font-semibold text-foreground">Ingest</h2>
              <p className="text-sm text-muted-foreground">
                Upload PDFs, DOCX, PPTX, and notes. We extract entities, links, and gaps.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 space-y-2">
              <h2 className="text-sm font-semibold text-foreground">Understand</h2>
              <p className="text-sm text-muted-foreground">
                An interactive knowledge graph plus an AI-readiness score.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 space-y-2">
              <h2 className="text-sm font-semibold text-foreground">Take it anywhere</h2>
              <p className="text-sm text-muted-foreground">
                Export your corpus or connect any AI agent with one API key.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              data-testid="try-demo-cta"
              onClick={tryDemo}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
            >
              Try Demo Org
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              data-testid="create-org-cta"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Create Organization
            </button>
          </div>
        </div>
      </main>

      <OrgNameDialog
        open={createOpen}
        title="Create organization"
        description="Name your workspace — you can rename or delete it later from the top bar."
        confirmLabel="Create"
        onConfirm={handleCreateOrg}
        onCancel={() => setCreateOpen(false)}
      />
    </div>
  );
}
