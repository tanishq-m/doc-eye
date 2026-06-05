"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Save, RotateCcw, Info, CheckCircle2 } from "lucide-react";
import { useCorpusStore } from "@/store/corpus";
import { DEMO_ACME_INSTRUCTIONS } from "@/lib/demoPersonas";
import { parseInstructionFile } from "@/lib/instructionParser";

const DEFAULT_TEMPLATE = `# ${"{orgName}"} — Response Guidelines

These instructions are applied to every AI-generated response in this organization.
Edit them to control how the AI behaves when answering questions.

## Legal & Compliance

- Always include footer: "Source: internal knowledge base"
- Specify any confidential project names to exclude

## Sensitive Data Masking

- Mask SSN: \\d{3}-\\d{2}-\\d{4} → [SSN REDACTED]
- Mask salary: \\$[0-9,]+ → [SALARY REDACTED]

## Excluded Topics

- List any topics the AI should never mention

## Response Format

- Use **bold** for key metrics and decisions
- Always cite source document filename
- Add confidence level: [High / Medium / Low Confidence]
`;

export default function InstructionsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const org = useCorpusStore((s) => s.orgs[orgId]);
  const updateInstructions = useCorpusStore((s) => s.updateInstructions);

  const [content, setContent] = useState(
    org?.instructions?.content ?? DEFAULT_TEMPLATE.replace("{orgName}", org?.name ?? "Organization")
  );
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Sync external instruction changes (e.g. init) into the editor only when not editing
  const externalContent = org?.instructions?.content;
  const displayContent = !isDirty && externalContent ? externalContent : content;

  if (!org) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Organization not found.
      </div>
    );
  }

  const parsed = parseInstructionFile(
    displayContent.trim()
      ? { id: "preview", orgId, content: displayContent, lastEdited: new Date().toISOString() }
      : undefined
  );

  const handleSave = () => {
    updateInstructions(orgId, displayContent);
    setSaved(true);
    setIsDirty(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    const demo = DEMO_ACME_INSTRUCTIONS.content;
    const fresh = org.isDemo ? demo : DEFAULT_TEMPLATE.replace("{orgName}", org.name);
    setContent(fresh);
    setIsDirty(true);
  };

  const handleChange = (val: string) => {
    setContent(val);
    setIsDirty(true);
    setSaved(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="instructions-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Response Instructions
          </p>
          <p className="text-sm text-muted-foreground max-w-lg">
            These rules guide the AI when answering questions for{" "}
            <span className="font-medium text-foreground">{org.name}</span>.
            Changes apply immediately to all future Ask queries.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            data-testid="instructions-reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to template
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty && !saved}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            data-testid="instructions-save"
          >
            {saved ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Editor */}
        <div className="space-y-2">
          {org.instructions?.lastEdited && (
            <p className="text-xs text-muted-foreground">
              Last saved:{" "}
              {new Date(org.instructions.lastEdited).toLocaleString()}
            </p>
          )}
          <textarea
            value={displayContent}
            onChange={(e) => handleChange(e.target.value)}
            data-testid="instructions-editor"
            spellCheck={false}
            className="w-full h-[520px] rounded-xl border border-border bg-background p-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none leading-relaxed"
            placeholder="Write your instructions in Markdown…"
          />
        </div>

        {/* Live preview panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Active Rules Preview
            </p>

            {parsed.appliedRules.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No rules detected yet. Add sections like{" "}
                <code className="bg-muted rounded px-1">## Sensitive Data Masking</code>{" "}
                or{" "}
                <code className="bg-muted rounded px-1">## Legal &amp; Compliance</code>.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {parsed.appliedRules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {parsed.legalFooter && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Legal Footer
              </p>
              <p className="text-xs text-foreground italic">&quot;{parsed.legalFooter}&quot;</p>
            </div>
          )}

          {parsed.excludedKeywords.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Excluded Topics
              </p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.excludedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-xs text-red-400"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Supported sections
              </p>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li><code className="bg-muted px-1 rounded">## Legal &amp; Compliance</code></li>
              <li><code className="bg-muted px-1 rounded">## Sensitive Data Masking</code></li>
              <li><code className="bg-muted px-1 rounded">## Excluded Topics</code></li>
              <li><code className="bg-muted px-1 rounded">## Response Format</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
