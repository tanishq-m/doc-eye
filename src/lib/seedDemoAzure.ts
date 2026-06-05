import { DEMO_ORG_ID, DEMO_DOCUMENT_CONTENT } from "@/lib/demoCorpusContent";
import { indexDocument } from "@/lib/search";

const DEMO_DOC_META: { id: string; title: string; filename: string }[] = [
  { id: "acme-d1", title: "Client Onboarding Playbook", filename: "client_onboarding.md" },
  { id: "acme-d2", title: "Project Delivery Framework", filename: "project_delivery.pdf" },
  { id: "acme-d3", title: "Risk Management Standards", filename: "risk_standards.docx" },
  { id: "acme-d4", title: "Security Compliance Guide", filename: "security_compliance.pdf" },
  { id: "acme-d5", title: "Data Governance Policy", filename: "data_governance.md" },
  { id: "acme-d6", title: "Change Management SOP", filename: "change_management.docx" },
  { id: "acme-d7", title: "Vendor Assessment Checklist", filename: "vendor_assessment.pdf" },
  { id: "acme-d8", title: "Stakeholder Communication Plan", filename: "stakeholder_comms.md" },
  { id: "acme-d9", title: "Quality Assurance Runbook", filename: "qa_runbook.docx" },
  { id: "acme-d10", title: "Incident Response Procedure", filename: "incident_response.pdf" },
  { id: "acme-d11", title: "Resource Planning Guide", filename: "resource_planning.md" },
  { id: "acme-d12", title: "Financial Controls Manual", filename: "financial_controls.docx" },
];

export async function seedDemoOrgToAzure(): Promise<{ indexed: number; orgId: string }> {
  let indexed = 0;
  for (const meta of DEMO_DOC_META) {
    const content = DEMO_DOCUMENT_CONTENT[meta.id];
    if (!content) continue;
    await indexDocument(DEMO_ORG_ID, meta.id, meta.title, meta.filename, content);
    indexed += 1;
  }
  return { indexed, orgId: DEMO_ORG_ID };
}
