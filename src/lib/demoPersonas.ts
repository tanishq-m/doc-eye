import type { InstructionFile, Persona } from "@/types";

const DEMO_ORG_ID = "demo-acme-consulting";

export const DEMO_ACME_INSTRUCTIONS: InstructionFile = {
  id: "acme-instructions-v1",
  orgId: DEMO_ORG_ID,
  lastEdited: "2026-06-01T09:00:00.000Z",
  content: `# Acme Consulting — Response Guidelines

These instructions are applied to every AI-generated response in this organization.
You can edit them to adjust how the AI behaves when answering questions.

## Legal & Compliance

- Always include footer: "Source: Acme internal knowledge base — handle per NDA"
- Never mention "Project Omega" or "Operation Falcon" in responses (client confidential)
- Financial data must include: "Subject to CFO review before external sharing"

## Sensitive Data Masking

- Mask SSN: \\d{3}-\\d{2}-\\d{4} → [SSN REDACTED]
- Mask salary: \\$[0-9,]+ → [SALARY REDACTED]
- Mask internal email: [a-zA-Z0-9._%+-]+@acmeconsulting\\.com → [INTERNAL EMAIL]

## Excluded Topics

- Project Omega (client confidential, ongoing deal)
- Executive compensation packages
- Unannounced product roadmap items

## Response Format

- Always **bold** key metrics, names, and decisions
- Use bullet points for lists of 3 or more items
- Include source document filename in parentheses after each cited fact
- Add confidence level at the end: [High / Medium / Low Confidence]`,
};

export function buildDemoPersonas(orgId: string = DEMO_ORG_ID): Persona[] {
  return [
    {
      id: `${orgId}-persona-leadership`,
      orgId,
      name: "Executive Summary",
      type: "leadership",
      description: "High-level metrics and strategic insights for C-suite",
      isBuiltIn: true,
      responseTemplate: "executive",
      searchFilters: {
        prioritizeDocTypes: ["report", "policy", "plan", "summary"],
      },
      systemPromptAppend:
        "Lead with the headline metric or decision. Assume the reader has 2 minutes, not 20.",
    },
    {
      id: `${orgId}-persona-engineer`,
      orgId,
      name: "Technical Deep Dive",
      type: "engineer",
      description: "Architecture, specs, and implementation detail for engineers",
      isBuiltIn: true,
      responseTemplate: "technical",
      searchFilters: {
        prioritizeDocTypes: ["guide", "procedure", "runbook", "specification", "manual"],
      },
      systemPromptAppend:
        "Include system names, APIs, and technical constraints. Skip the business narrative.",
    },
    {
      id: `${orgId}-persona-hr`,
      orgId,
      name: "HR & Compliance",
      type: "hr",
      description: "Policies, procedures, and compliance details for HR teams",
      isBuiltIn: true,
      responseTemplate: "detailed",
      searchFilters: {
        prioritizeDocTypes: ["policy", "procedure", "checklist", "sop", "handbook"],
      },
      systemPromptAppend:
        "Cite the policy name and section. Flag any compliance gaps or missing procedures.",
    },
  ];
}

/** Build a minimal set of built-in personas for a brand-new (non-demo) org. */
export function buildDefaultPersonas(orgId: string): Persona[] {
  return [
    {
      id: `${orgId}-persona-default`,
      orgId,
      name: "Standard",
      type: "custom",
      description: "Default response style — balanced and factual",
      isBuiltIn: true,
      responseTemplate: "summary",
    },
    {
      id: `${orgId}-persona-executive`,
      orgId,
      name: "Executive Summary",
      type: "leadership",
      description: "Concise, metric-led answers for leadership",
      isBuiltIn: true,
      responseTemplate: "executive",
    },
    {
      id: `${orgId}-persona-technical`,
      orgId,
      name: "Technical",
      type: "engineer",
      description: "Detailed technical answers for engineers",
      isBuiltIn: true,
      responseTemplate: "technical",
    },
  ];
}
