import type { Persona, PersonaType } from "@/types";

const PERSONA_SYSTEM_PROMPTS: Record<PersonaType, string> = {
  leadership: `You are briefing an executive leader. Adapt your response accordingly:
- Lead with the most important business metrics and outcomes
- Highlight ROI, strategic impact, and decision-relevant information
- Keep technical jargon minimal — explain concepts in business terms
- Use bullet points and bold key findings
- End with a clear, actionable recommendation or takeaway`,

  engineer: `You are speaking directly to a technical engineer. Adapt your response accordingly:
- Include architecture details, specifications, and implementation notes
- Reference systems, APIs, data flows, and technical components
- Use precise technical language; do not simplify
- Include relevant constraints, edge cases, and trade-offs
- Cite technical documentation sections where applicable`,

  hr: `You are addressing an HR or people-operations professional. Adapt your response accordingly:
- Focus on policies, procedures, and compliance requirements
- Highlight people, teams, org structure, and responsibilities
- Include regulatory or legal implications where relevant
- Use clear, unambiguous policy language
- Reference the relevant policy document and version where possible`,

  compliance: `You are advising a legal or compliance officer. Adapt your response accordingly:
- Prioritise regulatory requirements, audit trails, and risk controls
- Cite specific policy clauses or compliance standards by name
- Flag any gaps, ambiguities, or potential violations explicitly
- Use formal, precise language
- Structure the response as: Finding → Risk → Recommended Action`,

  customer: `You are responding on behalf of the company to a customer or external stakeholder.
- Use friendly, professional language — avoid internal jargon
- Focus on benefits, timelines, and what the customer needs to know
- Do not expose internal operational details or confidential information
- Keep the response concise and action-oriented
- End with a clear next step or call to action`,

  custom: `Answer the question accurately and helpfully based on the provided documents.`,
};

export function getPersonaSystemPrompt(persona?: Persona): string {
  if (!persona) return "";
  const base = PERSONA_SYSTEM_PROMPTS[persona.type] ?? PERSONA_SYSTEM_PROMPTS.custom;
  const append = persona.systemPromptAppend?.trim()
    ? `\n\nAdditional guidance:\n${persona.systemPromptAppend}`
    : "";
  return base + append;
}

export const BUILT_IN_PERSONA_CONFIGS: Record<
  "leadership" | "engineer" | "hr",
  Omit<Persona, "id" | "orgId">
> = {
  leadership: {
    name: "Executive Summary",
    type: "leadership",
    description: "High-level metrics and strategic insights for executives",
    isBuiltIn: true,
    responseTemplate: "executive",
    searchFilters: { prioritizeDocTypes: ["report", "policy", "plan"] },
  },
  engineer: {
    name: "Technical Deep Dive",
    type: "engineer",
    description: "Architecture, specs, and implementation details for engineers",
    isBuiltIn: true,
    responseTemplate: "technical",
    searchFilters: { prioritizeDocTypes: ["guide", "procedure", "specification", "manual", "runbook"] },
  },
  hr: {
    name: "HR & Compliance",
    type: "hr",
    description: "Policies, procedures, and compliance requirements for HR teams",
    isBuiltIn: true,
    responseTemplate: "detailed",
    searchFilters: { prioritizeDocTypes: ["policy", "procedure", "checklist", "sop"] },
  },
};
