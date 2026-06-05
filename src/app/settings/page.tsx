"use client";

import Link from "next/link";
import DocumentationPanel from "@/components/DocumentationPanel";
import InstructionsPanel from "@/components/InstructionsPanel";

export default function SettingsPage() {
  const services = [
    { name: "Azure OpenAI", envKey: "AZURE_OPENAI_ENDPOINT" },
    { name: "Azure AI Search", envKey: "AZURE_SEARCH_ENDPOINT" },
    { name: "Azure Document Intelligence", envKey: "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT" },
    { name: "Azure Blob Storage", envKey: "AZURE_STORAGE_CONNECTION_STRING" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-4xl mx-auto flex flex-col gap-8">
      <div>
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Azure service status and legacy instruction panels (kept off primary nav).
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground mb-1">Azure Services</h2>
        {services.map(({ name, envKey }) => {
          const configured = !!(process.env[envKey]);
          return (
            <div
              key={envKey}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-sm text-foreground">{name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  configured
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {configured ? "Configured" : "Not configured"}
              </span>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground pt-2">
          Update values in <code className="text-xs bg-muted px-1 rounded">.env.local</code> and
          restart the dev server.
        </p>
      </div>

      <section data-testid="settings-instructions">
        <h2 className="text-sm font-semibold text-foreground mb-3">Instructions</h2>
        <InstructionsPanel />
      </section>

      <section data-testid="settings-documentation">
        <h2 className="text-sm font-semibold text-foreground mb-3">Documentation</h2>
        <DocumentationPanel />
      </section>
    </div>
  );
}
