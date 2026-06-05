import { v4 as uuidv4 } from "uuid";
import type { Org, OrgExportBundle } from "@/types";

export interface ExternalAiAgent {
  id: string;
  name: string;
  vendor: string;
  icon: string;
  accent: string;
  tagline: string;
  blurb: string;
  setupSteps: string[];
}

export const EXTERNAL_AI_AGENTS: ExternalAiAgent[] = [
  {
    id: "claude",
    name: "Claude",
    vendor: "Anthropic",
    icon: "Cl",
    accent: "#d97757",
    tagline: "Long-context reasoning",
    blurb: "Paste the connector URL and API key into Claude custom connectors or Projects instructions.",
    setupSteps: [
      "Open Claude → Settings → Connectors (or your Project custom instructions).",
      "Add the DOC-EYE connector URL as a knowledge source endpoint.",
      "Paste your API key in the Authorization header field.",
      "Ask questions — Claude will pull grounded context from your org export.",
    ],
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    vendor: "OpenAI",
    icon: "GPT",
    accent: "#10a37f",
    tagline: "Custom GPT Actions",
    blurb: "Use a Custom GPT or Actions schema with the connector URL and bearer token.",
    setupSteps: [
      "Create a Custom GPT → Configure → Actions.",
      "Import the connector OpenAPI URL (or paste the REST endpoint manually).",
      "Set authentication to Bearer and paste your DOC-EYE API key.",
      "Save and chat — ChatGPT can query your exported corpus on demand.",
    ],
  },
  {
    id: "gemini",
    name: "Gemini",
    vendor: "Google",
    icon: "Ge",
    accent: "#4285f4",
    tagline: "Google AI tooling",
    blurb: "Add the connector in Gemini Extensions or Apps Script with your API key.",
    setupSteps: [
      "Open Gemini → Extensions / Google AI Studio tools.",
      "Register an HTTP tool pointing at the DOC-EYE connector URL.",
      "Supply the API key as a bearer token in request headers.",
      "Gemini can then ground answers in your organization's knowledge graph.",
    ],
  },
  {
    id: "codex",
    name: "Codex",
    vendor: "OpenAI / Cursor",
    icon: "Cx",
    accent: "#6366f1",
    tagline: "MCP / Cursor ready",
    blurb: "Drop the MCP-style config into Cursor, Codex CLI, or your agent's MCP settings.",
    setupSteps: [
      "Open your agent settings (Cursor → MCP, or Codex CLI config).",
      "Paste the generated MCP connector JSON from DOC-EYE.",
      "Restart the agent so it picks up the new knowledge source.",
      "Your coding agent can now reference uploaded docs and graph entities.",
    ],
  },
  {
    id: "meta-ai",
    name: "Meta AI",
    vendor: "Meta",
    icon: "Ma",
    accent: "#0064e0",
    tagline: "Open model workflows",
    blurb: "Configure a custom data connector in Meta AI studio workflows.",
    setupSteps: [
      "In Meta AI studio, add an HTTP knowledge connector step.",
      "Paste the DOC-EYE connector URL and API key.",
      "Map the org export fields to your workflow variables.",
      "Meta AI agents can consume the same corpus as DOC-EYE.",
    ],
  },
  {
    id: "copilot",
    name: "Microsoft Copilot",
    vendor: "Microsoft",
    icon: "Co",
    accent: "#0a7cbb",
    tagline: "Microsoft 365 ready",
    blurb: "Register DOC-EYE as a Copilot knowledge connector.",
    setupSteps: [
      "Open Copilot Studio → Knowledge → Add API.",
      "Enter the connector URL and bearer API key.",
      "Describe the org scope in the connector description.",
      "Copilot agents inherit your DOC-EYE readiness data.",
    ],
  },
];

export function generateExportApiKey(): string {
  const token = uuidv4().replace(/-/g, "");
  return `doc-eye_${token.slice(0, 24)}`;
}

export function buildConnectorUrl(origin: string, orgId: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/api/org-connector?orgId=${encodeURIComponent(orgId)}`;
}

export function buildOrgExportBundle(org: Org): OrgExportBundle {
  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    org: {
      id: org.id,
      name: org.name,
      isDemo: org.isDemo,
      aiProvider: org.aiProvider ?? "mistral",
      score: org.score,
      documentCount: org.documents.length,
      entityCount: org.entities.length,
      relationshipCount: org.relationships.length,
      gapCount: org.gaps.length,
    },
    documents: org.documents.map((d) => ({
      id: d.id,
      title: d.title,
      filename: d.filename,
      content: d.content,
      uploadedAt: d.uploadedAt,
    })),
    entities: org.entities,
    relationships: org.relationships,
    gaps: org.gaps,
    history: org.history,
  };
}

export function buildMcpConnectorConfig(
  connectorUrl: string,
  apiKey: string,
  orgName: string
): string {
  return JSON.stringify(
    {
      mcpServers: {
        "doc-eye": {
          url: connectorUrl,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          description: `DOC-EYE knowledge graph for ${orgName}`,
        },
      },
    },
    null,
    2
  );
}

export function buildAgentSetupSnippet(
  agent: ExternalAiAgent,
  connectorUrl: string,
  apiKey: string,
  orgName: string
): string {
  if (agent.id === "codex") {
    return buildMcpConnectorConfig(connectorUrl, apiKey, orgName);
  }

  return [
    `# Connect ${agent.name} to DOC-EYE — ${orgName}`,
    ``,
    `Connector URL: ${connectorUrl}`,
    `API Key: ${apiKey}`,
    ``,
    `Authorization header: Bearer ${apiKey}`,
    ``,
    ...agent.setupSteps.map((step, i) => `${i + 1}. ${step}`),
  ].join("\n");
}

export function triggerJsonDownload(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
