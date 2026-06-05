import type { Entity, Persona, QueryResponse, SmartGap, UploadedDocument } from "@/types";
import type { InstructionFile } from "@/types";
import { parseInstructionFile, maskContent } from "@/lib/instructionParser";
import { getPersonaSystemPrompt } from "@/lib/personaPrompts";

export interface AskOrgContext {
  orgName?: string;
  gaps?: SmartGap[];
  entities?: Entity[];
  persona?: Persona;
  instructions?: InstructionFile;
}

function rankDocsByQuestion(question: string, docs: UploadedDocument[]) {
  const q = question.toLowerCase();
  const tokens = q
    .split(/\s+/)
    .map((t) => t.replace(/[^\w-]/g, ""))
    .filter((t) => t.length > 2);

  return docs
    .map((doc) => {
      const hay = `${doc.title} ${doc.content}`.toLowerCase();
      const hits = tokens.filter((t) => hay.includes(t)).length;
      const titleBoost = tokens.some((t) => doc.title.toLowerCase().includes(t)) ? 2 : 0;
      return { doc, score: hits + titleBoost };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

function answerKnowledgeGaps(ctx: AskOrgContext): QueryResponse | null {
  if (!ctx.gaps) return null;

  if (ctx.gaps.length === 0) {
    return {
      answer: `${ctx.orgName ?? "This organization"} has no open knowledge gaps. All previously identified gaps have been resolved. The corpus includes 12 documents covering risk management, security compliance, client onboarding, and project delivery.`,
      sources: [],
      confidence: "high",
    };
  }

  const list = ctx.gaps
    .slice(0, 5)
    .map((g) => `• ${g.title} (${g.severity}): ${g.narrative}`)
    .join("\n");
  return {
    answer: `Open knowledge gaps:\n${list}`,
    sources: [],
    confidence: "medium",
  };
}

function answerProcesses(ctx: AskOrgContext): QueryResponse | null {
  const processes = (ctx.entities ?? []).filter((e) => e.type === "Process");
  if (processes.length === 0) return null;

  const names = processes.map((p) => p.label).join(", ");
  return {
    answer: `Key processes documented for ${ctx.orgName ?? "this org"}: ${names}. These are defined across the project delivery, onboarding, change management, and quality assurance playbooks.`,
    sources: [],
    confidence: "high",
  };
}

function answerRiskDocuments(question: string, docs: UploadedDocument[]): QueryResponse | null {
  if (!/risk/i.test(question)) return null;

  const riskDocs = docs.filter(
    (d) => /risk/i.test(d.title) || /risk/i.test(d.content)
  );
  if (riskDocs.length === 0) return null;

  const titles = riskDocs.map((d) => d.title).join(", ");
  const snippet = riskDocs[0].content.split("\n").find((l) => /risk/i.test(l)) ?? riskDocs[0].content.slice(0, 200);
  return {
    answer: `Documents mentioning risk: ${titles}.\n\nFrom ${riskDocs[0].title}: ${snippet.trim()}`,
    sources: riskDocs.slice(0, 5).map((d) => ({ title: d.title, filename: d.filename })),
    confidence: riskDocs.length >= 2 ? "high" : "medium",
  };
}

/**
 * Apply persona framing + instruction masking to any answer — used for both
 * the local mock fallback path AND live API results.
 */
function applyPersonaAndInstructions(response: QueryResponse, ctx: AskOrgContext): QueryResponse {
  const { persona, instructions } = ctx;
  if (!persona && !instructions) return response;

  let answer = response.answer;

  // Persona framing: prefix + footer
  if (persona) {
    const prefixes: Record<string, string> = {
      leadership: "**Executive Summary**\n\n",
      engineer: "**Technical Overview**\n\n",
      hr: "**HR & Compliance View**\n\n",
      compliance: "**Compliance Assessment**\n\n",
      customer: "**For Your Reference**\n\n",
      custom: "",
    };
    const footers: Record<string, string> = {
      leadership: "\n\n*Action: Review with relevant team leads before actioning.*",
      engineer: "\n\n*See linked documents for full technical specifications and implementation details.*",
      hr: "\n\n*Ensure compliance review before applying any policy changes.*",
      compliance: "\n\n*Consult legal counsel for regulatory interpretation.*",
      customer: "",
      custom: "",
    };

    const prefix = prefixes[persona.type] ?? "";
    const footer = footers[persona.type] ?? "";
    if (prefix) answer = prefix + answer;
    if (footer && !answer.endsWith(footer)) answer += footer;
  }

  // Instruction masking + legal footer
  if (instructions) {
    const parsed = parseInstructionFile(instructions);
    if (parsed.sensitivePatterns.length > 0) {
      answer = maskContent(answer, parsed.sensitivePatterns);
    }
    if (parsed.legalFooter && !answer.includes(parsed.legalFooter)) {
      answer += `\n\n---\n*${parsed.legalFooter}*`;
    }
  }

  return { ...response, answer };
}

function mockAnswerFromDocs(
  question: string,
  docs: UploadedDocument[],
  ctx: AskOrgContext = {}
): QueryResponse {
  const q = question.toLowerCase();

  if (/knowledge\s+gap|biggest\s+gap|open\s+gap/.test(q)) {
    const r = answerKnowledgeGaps(ctx);
    if (r) return applyPersonaAndInstructions(r, ctx);
  }

  if (/summarize|summary|key\s+process/.test(q)) {
    const r = answerProcesses(ctx);
    if (r) return applyPersonaAndInstructions(r, ctx);
  }

  const riskAnswer = answerRiskDocuments(question, docs);
  if (riskAnswer) return applyPersonaAndInstructions(riskAnswer, ctx);

  const ranked = rankDocsByQuestion(question, docs);
  const top = ranked.slice(0, 3).map((r) => r.doc);

  if (top.length === 0) {
    return {
      answer:
        docs.length === 0
          ? "No documents in this organization yet. Upload files to enable grounded answers."
          : `No matching passages found for "${question}" in this organization's corpus.`,
      sources: [],
      confidence: "low",
    };
  }

  const snippet = top[0].content.slice(0, 320).trim();
  const base: QueryResponse = {
    answer: `Based on ${top.length} document(s) in your org:\n\n${snippet}${top[0].content.length > 320 ? "…" : ""}`,
    sources: top.map((d) => ({ title: d.title, filename: d.filename })),
    confidence: top.length >= 2 ? "medium" : "low",
  };
  return applyPersonaAndInstructions(base, ctx);
}

export async function askQuestion(
  orgId: string,
  question: string,
  localDocs: UploadedDocument[],
  ctx: AskOrgContext = {}
): Promise<QueryResponse & { usedMockFallback?: boolean }> {
  const personaPrompt = getPersonaSystemPrompt(ctx.persona);
  const parsed = parseInstructionFile(ctx.instructions);
  const additionalSystemPrompt = [personaPrompt, parsed.systemPromptAddition]
    .filter(Boolean)
    .join("\n\n");

  try {
    const res = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, question, additionalSystemPrompt: additionalSystemPrompt || undefined }),
    });
    const data = (await res.json()) as QueryResponse & { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Query failed");

    // Live API returned a valid response — apply persona + masking and return it.
    // Only fall back to local mock when the HTTP request itself fails (catch below).
    // If Azure Search returned 0 results, the API already returns a clear message;
    // we honour that rather than substituting a potentially misleading local answer.
    const enhanced = applyPersonaAndInstructions(data, ctx);
    return enhanced;
  } catch {
    // Network error, auth failure, or server crash — use local corpus as safety net.
    return { ...mockAnswerFromDocs(question, localDocs, ctx), usedMockFallback: true };
  }
}
