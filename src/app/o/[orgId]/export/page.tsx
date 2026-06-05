"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bot,
  Check,
  Copy,
  Download,
  KeyRound,
  Link2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  EXTERNAL_AI_AGENTS,
  buildAgentSetupSnippet,
  buildConnectorUrl,
  buildMcpConnectorConfig,
  buildOrgExportBundle,
  triggerJsonDownload,
} from "@/lib/orgExport";
import { graphStats } from "@/lib/readiness";
import { useCorpusStore } from "@/store/corpus";

function CopyField({
  label,
  value,
  testId,
  mono = true,
}: {
  label: string;
  value: string;
  testId: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex gap-2">
        <code
          data-testid={testId}
          className={`flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground break-all ${
            mono ? "font-mono" : ""
          }`}
        >
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          data-testid={`${testId}-copy`}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default function ExportPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const org = useCorpusStore((s) => s.orgs[orgId]);
  const ensureExportCredentials = useCorpusStore((s) => s.ensureExportCredentials);
  const regenerateExportCredentials = useCorpusStore((s) => s.regenerateExportCredentials);

  const [origin] = useState(
    () => (typeof window !== "undefined" ? window.location.origin : "https://doc-eye.app")
  );
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  useEffect(() => {
    if (org) ensureExportCredentials(orgId);
  }, [org, orgId, ensureExportCredentials]);

  const credentials = org?.exportCredentials;
  const connectorUrl = useMemo(
    () => (org ? buildConnectorUrl(origin, org.id) : ""),
    [origin, org]
  );

  if (!org) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Organization not found.
      </div>
    );
  }

  const stats = graphStats(org);
  const bundle = buildOrgExportBundle(org);
  const mcpConfig = credentials
    ? buildMcpConnectorConfig(connectorUrl, credentials.apiKey, org.name)
    : "";

  const handleExport = () => {
    const slug = org.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    triggerJsonDownload(`doc-eye-${slug || org.id}.json`, bundle);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8" data-testid="export-page">
      <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card to-card p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Export &amp; AI agent connector
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Take your knowledge anywhere
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            View, download, and connect <span className="text-foreground font-medium">{org.name}</span>
            &apos;s corpus to Claude, ChatGPT, Gemini, Codex, Meta AI, and other agents. Your data
            stays portable — plug the connector into whichever AI you prefer.
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="export-stats">
        {[
          { label: "Documents", value: stats.docCount },
          { label: "Entities", value: stats.entityCount },
          { label: "Relationships", value: stats.edgeCount },
          { label: "Readiness", value: `${org.score.overall}/100` },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
            <p className="text-2xl font-semibold tabular-nums mt-1">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-card p-6 space-y-4" data-testid="export-download">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <Download className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">Download full export</h2>
            <p className="text-xs text-muted-foreground mt-1">
              JSON bundle with documents, entities, relationships, gaps, and readiness history —
              ready for backup or import into another system.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            data-testid="export-download-btn"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export JSON
          </button>
        </div>
      </section>

      <section
        className="rounded-xl border border-border bg-card p-6 space-y-5"
        data-testid="export-connector"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <KeyRound className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">AI agent connector</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Generated credentials for external agents. Paste the URL and API key into your
                preferred AI tool — no vendor lock-in.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => regenerateExportCredentials(orgId)}
            data-testid="export-regenerate-key"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Regenerate key
          </button>
        </div>

        {credentials ? (
          <div className="space-y-4">
            <CopyField label="Connector URL" value={connectorUrl} testId="export-connector-url" />
            <CopyField label="API key" value={credentials.apiKey} testId="export-api-key" />
            <CopyField
              label="MCP config (Codex / Cursor)"
              value={mcpConfig}
              testId="export-mcp-config"
            />
            <p className="text-xs text-amber-400/90 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              Secure connector — authenticate with{" "}
              <code className="font-mono">Authorization: Bearer &lt;api-key&gt;</code>. Export JSON
              for full offline use or connect your preferred AI agent.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Generating credentials…</p>
        )}
      </section>

      <section className="space-y-4" data-testid="export-ai-agents">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-accent" aria-hidden />
          <h2 className="text-sm font-semibold text-foreground">Use with your preferred AI agent</h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Click an agent for copy-paste setup instructions. Put the connector URL and API key in
          your agent&apos;s knowledge / MCP / Actions settings.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {EXTERNAL_AI_AGENTS.map((agent) => {
            const expanded = expandedAgent === agent.id;
            const snippet =
              credentials &&
              buildAgentSetupSnippet(agent, connectorUrl, credentials.apiKey, org.name);

            return (
              <motion.article
                key={agent.id}
                layout
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  type="button"
                  data-testid={`export-agent-${agent.id}`}
                  onClick={() => setExpandedAgent(expanded ? null : agent.id)}
                  className="w-full text-left p-5 flex items-start gap-3 hover:bg-muted/20 transition-colors"
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ring-2"
                    style={{
                      backgroundColor: `${agent.accent}22`,
                      color: agent.accent,
                      borderColor: `${agent.accent}44`,
                    }}
                  >
                    {agent.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {agent.vendor}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: agent.accent }}>
                      {agent.tagline}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{agent.blurb}</p>
                  </div>
                  <Link2 className="h-4 w-4 text-muted-foreground shrink-0 mt-1" aria-hidden />
                </button>

                {expanded && snippet && (
                  <div className="border-t border-border px-5 pb-5 space-y-3">
                    <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                      {agent.setupSteps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <CopyField
                      label={`${agent.name} setup snippet`}
                      value={snippet}
                      testId={`export-snippet-${agent.id}`}
                    />
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
