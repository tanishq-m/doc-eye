import { describe, it, expect } from "vitest";
import {
  EXTERNAL_AI_AGENTS,
  buildAgentSetupSnippet,
  buildConnectorUrl,
  buildMcpConnectorConfig,
  buildOrgExportBundle,
  generateExportApiKey,
} from "@/lib/orgExport";
import { computeScore } from "@/lib/readiness";
import type { Org } from "@/types";

function minimalOrg(): Org {
  return {
    id: "org-abc",
    name: "Test Org",
    createdAt: "2026-01-01T00:00:00.000Z",
    isDemo: false,
    documents: [
      {
        id: "d1",
        title: "Policy",
        filename: "policy.md",
        content: "Policy content",
        uploadedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    entities: [
      { id: "e1", label: "Policy", type: "Process", docIds: ["d1"], mentions: 3 },
    ],
    relationships: [],
    gaps: [],
    score: computeScore({
      id: "x",
      name: "x",
      createdAt: "",
      isDemo: false,
      documents: [],
      entities: [],
      relationships: [],
      gaps: [],
      score: { completeness: 0, quality: 0, connectivity: 0, metadata: 0, overall: 0 },
      history: [],
    }),
    history: [],
  };
}

describe("orgExport", () => {
  it("generates doc-eye prefixed API keys", () => {
    const key = generateExportApiKey();
    expect(key.startsWith("doc-eye_")).toBe(true);
    expect(key.length).toBeGreaterThan(20);
  });

  it("builds connector URL with orgId", () => {
    expect(buildConnectorUrl("http://localhost:3000", "org-1")).toBe(
      "http://localhost:3000/api/org-connector?orgId=org-1"
    );
  });

  it("builds export bundle with org summary and documents", () => {
    const bundle = buildOrgExportBundle(minimalOrg());
    expect(bundle.version).toBe("1.0");
    expect(bundle.org.name).toBe("Test Org");
    expect(bundle.org.documentCount).toBe(1);
    expect(bundle.documents).toHaveLength(1);
    expect(bundle.entities).toHaveLength(1);
  });

  it("includes MCP config JSON for Codex-style agents", () => {
    const json = buildMcpConnectorConfig(
      "http://localhost:3000/api/org-connector?orgId=org-abc",
      "doc-eye_testkey",
      "Test Org"
    );
    const parsed = JSON.parse(json) as { mcpServers: Record<string, { url: string }> };
    expect(parsed.mcpServers["doc-eye"].url).toContain("org-abc");
  });

  it("lists external AI agents with setup steps", () => {
    expect(EXTERNAL_AI_AGENTS.length).toBeGreaterThanOrEqual(5);
    expect(EXTERNAL_AI_AGENTS.some((a) => a.id === "claude")).toBe(true);
    expect(EXTERNAL_AI_AGENTS.some((a) => a.id === "chatgpt")).toBe(true);
    expect(EXTERNAL_AI_AGENTS.some((a) => a.id === "gemini")).toBe(true);
  });

  it("every external agent has accent color and tagline", () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;
    for (const agent of EXTERNAL_AI_AGENTS) {
      expect(agent.accent).toMatch(hexPattern);
      expect(agent.tagline.trim().length).toBeGreaterThan(0);
    }
  });

  it("builds per-agent setup snippets with connector URL and key", () => {
    const claude = EXTERNAL_AI_AGENTS.find((a) => a.id === "claude")!;
    const snippet = buildAgentSetupSnippet(
      claude,
      "http://localhost/api/org-connector?orgId=x",
      "doc-eye_abc",
      "My Org"
    );
    expect(snippet).toContain("doc-eye_abc");
    expect(snippet).toContain("org-connector");
  });
});
