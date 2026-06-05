import { computeScore } from "@/lib/readiness";
import { generateExportApiKey } from "@/lib/orgExport";
import { DEMO_DOCUMENT_CONTENT, DEMO_ORG_ID } from "@/lib/demoCorpusContent";
import { DEMO_ACME_INSTRUCTIONS, buildDemoPersonas } from "@/lib/demoPersonas";
import type {
  Entity,
  EntityType,
  Org,
  ReadinessSnapshot,
  Relationship,
  UploadedDocument,
} from "@/types";

const DEMO_ORG_IDS = {
  acme: DEMO_ORG_ID,
} as const;

function entity(
  id: string,
  label: string,
  type: EntityType,
  docIds: string[],
  mentions: number
): Entity {
  return { id, label, type, docIds, mentions };
}

function rel(id: string, source: string, target: string, label: string): Relationship {
  return { id, source, target, label };
}

function doc(id: string, title: string, filename: string): UploadedDocument {
  return {
    id,
    title,
    filename,
    content: DEMO_DOCUMENT_CONTENT[id] ?? `Content for ${title}`,
    uploadedAt: "2026-05-01T10:00:00.000Z",
  };
}

function buildHistory(start: number, points: number): ReadinessSnapshot[] {
  const base = new Date("2026-01-01T00:00:00.000Z");
  return Array.from({ length: points }, (_, i) => ({
    at: new Date(base.getTime() + i * 30 * 24 * 60 * 60 * 1000).toISOString(),
    overall: start + i * 4,
  }));
}

const DEMO_ACME_OPEN_GAPS = [
  {
    id: "acme-g1",
    title: "Risk Mitigation Strategy",
    severity: "critical" as const,
    narrative:
      "Project Delivery is mentioned in 37 documents but no dedicated risk mitigation strategy exists.",
    impactedDocs: ["Project Delivery Framework", "Digital Transformation 2026", "Sprint Planning"],
  },
  {
    id: "acme-g2",
    title: "Client Offboarding Procedure",
    severity: "warning" as const,
    narrative:
      "Client onboarding appears complete but offboarding is referenced in 8 docs with no source document.",
    impactedDocs: ["Client Onboarding Playbook", "Knowledge Transfer"],
  },
];

function buildAcmeOrg(): Org {
  const documents = [
    doc("acme-d1", "Client Onboarding Playbook", "client_onboarding.md"),
    doc("acme-d2", "Project Delivery Framework", "project_delivery.pdf"),
    doc("acme-d3", "Risk Management Standards", "risk_standards.docx"),
    doc("acme-d4", "Security Compliance Guide", "security_compliance.pdf"),
    doc("acme-d5", "Data Governance Policy", "data_governance.md"),
    doc("acme-d6", "Change Management SOP", "change_management.docx"),
    doc("acme-d7", "Vendor Assessment Checklist", "vendor_assessment.pdf"),
    doc("acme-d8", "Stakeholder Communication Plan", "stakeholder_comms.md"),
    doc("acme-d9", "Quality Assurance Runbook", "qa_runbook.docx"),
    doc("acme-d10", "Incident Response Procedure", "incident_response.pdf"),
    doc("acme-d11", "Resource Planning Guide", "resource_planning.md"),
    doc("acme-d12", "Financial Controls Manual", "financial_controls.docx"),
  ];

  const entities: Entity[] = [
    entity("acme-e1", "Meridian Bank", "Client", ["acme-d1", "acme-d2"], 14),
    entity("acme-e2", "Northwind Health", "Client", ["acme-d1", "acme-d8"], 11),
    entity("acme-e3", "Atlas Retail Group", "Client", ["acme-d2", "acme-d7"], 9),
    entity("acme-e4", "Digital Transformation 2026", "Project", ["acme-d2", "acme-d6"], 22),
    entity("acme-e5", "ERP Modernization", "Project", ["acme-d2", "acme-d11"], 18),
    entity("acme-e6", "Cloud Migration Phase 2", "Project", ["acme-d4", "acme-d6"], 15),
    entity("acme-e7", "Advisory Practice", "Team", ["acme-d1", "acme-d2"], 8),
    entity("acme-e8", "Delivery Excellence", "Team", ["acme-d2", "acme-d9"], 10),
    entity("acme-e9", "Risk & Compliance", "Team", ["acme-d3", "acme-d4"], 12),
    entity("acme-e10", "Client Onboarding", "Process", ["acme-d1"], 16),
    entity("acme-e11", "Project Kickoff", "Process", ["acme-d2", "acme-d8"], 13),
    entity("acme-e12", "Sprint Planning", "Process", ["acme-d2", "acme-d11"], 7),
    entity("acme-e13", "Change Approval", "Process", ["acme-d6"], 9),
    entity("acme-e14", "Vendor Due Diligence", "Process", ["acme-d7"], 6),
    entity("acme-e15", "Data Breach Risk", "Risk", ["acme-d3", "acme-d4"], 8),
    entity("acme-e16", "Scope Creep", "Risk", ["acme-d2", "acme-d5"], 11),
    entity("acme-e17", "Regulatory Non-Compliance", "Risk", ["acme-d3", "acme-d4"], 10),
    entity("acme-e18", "Resource Shortage", "Risk", ["acme-d11"], 7),
    entity("acme-e19", "SharePoint Repository", "Dependency", ["acme-d5", "acme-d8"], 5),
    entity("acme-e20", "Jira Workflow", "Dependency", ["acme-d2", "acme-d6"], 6),
    entity("acme-e21", "Salesforce CRM", "Dependency", ["acme-d1", "acme-d8"], 4),
    entity("acme-e22", "Confluence Wiki", "Dependency", ["acme-d9", "acme-d10"], 5),
    entity("acme-e23", "SOC 2 Audit Trail", "Document", ["acme-d4"], 3),
    entity("acme-e24", "GDPR Data Map", "Document", ["acme-d5"], 4),
    entity("acme-e25", "Steering Committee", "Team", ["acme-d8", "acme-d12"], 6),
    entity("acme-e26", "Penetration Test Report", "Document", ["acme-d4"], 2),
    entity("acme-e27", "Business Continuity Plan", "Process", ["acme-d10"], 5),
    entity("acme-e28", "Third-Party Risk", "Risk", ["acme-d7", "acme-d3"], 8),
    entity("acme-e29", "Knowledge Transfer", "Process", ["acme-d1", "acme-d9"], 7),
    entity("acme-e30", "Executive Reporting", "Process", ["acme-d8", "acme-d12"], 9),
    entity("acme-e31", "FinServ Compliance", "Client", ["acme-d3", "acme-d12"], 6),
    entity("acme-e32", "API Gateway", "Dependency", ["acme-d4", "acme-d6"], 4),
    entity("acme-e33", "Post-Implementation Review", "Process", ["acme-d2", "acme-d9"], 5),
    entity("acme-e34", "Budget Overrun", "Risk", ["acme-d12", "acme-d2"], 6),
    entity("acme-e35", "Training Program", "Process", ["acme-d1", "acme-d9"], 4),
  ];

  const relationships: Relationship[] = [
    rel("acme-r1", "acme-e1", "acme-e4", "sponsors"),
    rel("acme-r2", "acme-e2", "acme-e5", "sponsors"),
    rel("acme-r3", "acme-e3", "acme-e6", "sponsors"),
    rel("acme-r4", "acme-e4", "acme-e7", "owned_by"),
    rel("acme-r5", "acme-e5", "acme-e8", "owned_by"),
    rel("acme-r6", "acme-e6", "acme-e9", "reviewed_by"),
    rel("acme-r7", "acme-e10", "acme-e1", "applies_to"),
    rel("acme-r8", "acme-e11", "acme-e4", "starts"),
    rel("acme-r9", "acme-e12", "acme-e5", "governs"),
    rel("acme-r10", "acme-e13", "acme-e6", "required_for"),
    rel("acme-r11", "acme-e14", "acme-e3", "validates"),
    rel("acme-r12", "acme-e15", "acme-e6", "threatens"),
    rel("acme-r13", "acme-e16", "acme-e4", "threatens"),
    rel("acme-r14", "acme-e17", "acme-e31", "threatens"),
    rel("acme-r15", "acme-e18", "acme-e5", "threatens"),
    rel("acme-r16", "acme-e19", "acme-e5", "stores"),
    rel("acme-r17", "acme-e20", "acme-e12", "tracks"),
    rel("acme-r18", "acme-e21", "acme-e10", "feeds"),
    rel("acme-r19", "acme-e22", "acme-e9", "documents"),
    rel("acme-r20", "acme-e23", "acme-e17", "evidences"),
    rel("acme-r21", "acme-e24", "acme-e15", "mitigates"),
    rel("acme-r22", "acme-e25", "acme-e4", "governs"),
    rel("acme-r23", "acme-e27", "acme-e15", "responds_to"),
    rel("acme-r24", "acme-e28", "acme-e14", "extends"),
    rel("acme-r25", "acme-e29", "acme-e33", "precedes"),
    rel("acme-r26", "acme-e30", "acme-e25", "reports_to"),
    rel("acme-r27", "acme-e32", "acme-e6", "enables"),
    rel("acme-r28", "acme-e34", "acme-e4", "threatens"),
    rel("acme-r29", "acme-e35", "acme-e10", "supports"),
    rel("acme-r30", "acme-e7", "acme-e8", "collaborates_with"),
    rel("acme-r31", "acme-e8", "acme-e9", "escalates_to"),
    rel("acme-r32", "acme-e1", "acme-e31", "regulated_under"),
    rel("acme-r33", "acme-e4", "acme-e20", "depends_on"),
    rel("acme-r34", "acme-e5", "acme-e19", "depends_on"),
    rel("acme-r35", "acme-e6", "acme-e32", "depends_on"),
    rel("acme-r36", "acme-e10", "acme-e21", "integrates_with"),
    rel("acme-r37", "acme-e11", "acme-e30", "triggers"),
    rel("acme-r38", "acme-e12", "acme-e18", "constrained_by"),
    rel("acme-r39", "acme-e13", "acme-e25", "approved_by"),
    rel("acme-r40", "acme-e14", "acme-e28", "surfaces"),
    rel("acme-r41", "acme-e15", "acme-e27", "requires"),
    rel("acme-r42", "acme-e16", "acme-e33", "resolved_by"),
    rel("acme-r43", "acme-e17", "acme-e23", "audited_via"),
    rel("acme-r44", "acme-e18", "acme-e11", "blocks"),
    rel("acme-r45", "acme-e2", "acme-e10", "onboards_via"),
    rel("acme-r46", "acme-e3", "acme-e14", "vetted_by"),
    rel("acme-r47", "acme-e31", "acme-e12", "governed_by"),
    rel("acme-r48", "acme-e26", "acme-e15", "informs"),
    rel("acme-r49", "acme-e24", "acme-e19", "stored_in"),
    rel("acme-r50", "acme-e33", "acme-e9", "reviewed_by"),
    rel("acme-r51", "acme-e27", "acme-e10", "protects"),
    rel("acme-r52", "acme-e35", "acme-e7", "owned_by"),
    rel("acme-r53", "acme-e30", "acme-e12", "informs"),
    rel("acme-r54", "acme-e28", "acme-e17", "amplifies"),
    rel("acme-r55", "acme-e34", "acme-e30", "reported_in"),
    rel("acme-r56", "acme-e22", "acme-e29", "hosts"),
    rel("acme-r57", "acme-e20", "acme-e13", "enforces"),
    rel("acme-r58", "acme-e21", "acme-e2", "tracks"),
    rel("acme-r59", "acme-e32", "acme-e4", "secures"),
    rel("acme-r60", "acme-e25", "acme-e34", "monitors"),
    rel("acme-r61", "acme-e9", "acme-e23", "maintains"),
    rel("acme-r62", "acme-e8", "acme-e33", "executes"),
    rel("acme-r63", "acme-e7", "acme-e1", "serves"),
    rel("acme-r64", "acme-e6", "acme-e16", "exposed_to"),
    rel("acme-r65", "acme-e5", "acme-e18", "limited_by"),
  ];

  const history = buildHistory(48, 6);
  const org: Org = {
    id: DEMO_ORG_IDS.acme,
    name: "Acme Consulting",
    createdAt: "2025-06-01T00:00:00.000Z",
    isDemo: true,
    aiProvider: "mistral",
    documents,
    entities,
    relationships,
    gaps: [...DEMO_ACME_OPEN_GAPS],
    dismissedGapIds: [],
    exportCredentials: {
      apiKey: generateExportApiKey(),
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    score: { completeness: 0, quality: 0, connectivity: 0, metadata: 0, overall: 0 },
    history,
    instructions: DEMO_ACME_INSTRUCTIONS,
    personas: buildDemoPersonas(DEMO_ORG_IDS.acme),
    defaultPersonaId: `${DEMO_ORG_IDS.acme}-persona-leadership`,
  };
  org.score = computeScore(org);
  return org;
}

/** Sample gaps used by demo org defaults and gap UI tests. */
export const DEMO_GAP_FIXTURES = DEMO_ACME_OPEN_GAPS;

export function seedDemoOrgs(): Org[] {
  return [buildAcmeOrg()];
}

export function getDemoOrgIds(): string[] {
  return Object.values(DEMO_ORG_IDS);
}
