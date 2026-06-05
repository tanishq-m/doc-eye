/** Rich document bodies for the Acme Consulting demo org (client + server safe). */

export const DEMO_ORG_ID = "demo-acme-consulting";

export const DEMO_DOCUMENT_CONTENT: Record<string, string> = {
  "acme-d1": `Client Onboarding Playbook

New enterprise clients (e.g. Meridian Bank, Northwind Health) enter through a 30-day onboarding track.
Week 1: executive alignment, data room access, and stakeholder mapping.
Week 2: discovery workshops and current-state process capture.
Week 3: knowledge transfer sessions and tool provisioning (Salesforce CRM, SharePoint).
Week 4: go-live readiness review with Delivery Excellence and Risk & Compliance sign-off.

All onboarding artifacts must be stored in the org knowledge graph before project kickoff.`,

  "acme-d2": `Project Delivery Framework

Standard delivery lifecycle for Digital Transformation 2026, ERP Modernization, and Cloud Migration Phase 2.
Phases: initiate, plan, execute, monitor, close. Sprint planning and change approval gates apply.
Scope creep is a tracked risk — every change request requires steering committee approval.
Dependencies: Jira workflow for work tracking, API Gateway for integration endpoints.
Post-implementation review is mandatory within 30 days of go-live.`,

  "acme-d3": `Risk Management Standards

Enterprise risk taxonomy covers operational, regulatory, financial, and third-party risk.
Key risk categories: data breach risk, regulatory non-compliance, scope creep, resource shortage,
third-party risk, and budget overrun. Each project maintains a living risk register updated weekly.
Risk & Compliance team reviews all critical and high risks before phase gates.
Risk mitigation strategies must be documented for every critical finding.
This standard applies to Meridian Bank FinServ engagements and all cloud migration work.`,

  "acme-d4": `Security Compliance Guide

SOC 2 Type II controls, penetration testing cadence, and GDPR alignment for client data.
API security standards require authentication, encryption in transit, and quarterly access reviews.
Incident response ties to the Business Continuity Plan and disaster recovery runbook references.
Data breach risk is elevated during cloud migration — enforce zero-trust principles on API Gateway paths.
Penetration test reports inform annual security roadmap priorities.`,

  "acme-d5": `Data Governance Policy

Authoritative policy for data classification, retention, and lineage across SharePoint and CRM systems.
GDPR data maps must be maintained for EU client data. PII handling requires encryption at rest.
Data retention periods: financial records 7 years, project artifacts 5 years, logs 1 year.
Metadata quality directly impacts AI readiness scores for organizational knowledge bases.`,

  "acme-d6": `Change Management SOP

All production changes require change approval from the steering committee and Risk & Compliance.
Emergency changes need retrospective review within 48 hours. Jira workflow enforces approval chains.
Cloud Migration Phase 2 changes must include rollback plans and API Gateway impact assessment.`,

  "acme-d7": `Vendor Assessment Checklist

Third-party and vendor due diligence for Atlas Retail Group suppliers and technology partners.
Covers financial stability, security posture, data handling, and exit strategy requirements.
Third-party risk scores feed the enterprise risk register and vendor exit strategy planning.`,

  "acme-d8": `Stakeholder Communication Plan

Executive reporting cadence for steering committee and client sponsors.
Escalation matrix defines paths from project teams to Advisory Practice leadership.
Meridian Bank and Northwind Health receive bi-weekly status dashboards during active engagements.`,

  "acme-d9": `Quality Assurance Runbook

QA gates for deliverables: peer review, client sign-off, and knowledge transfer validation.
Confluence wiki hosts approved templates. Post-implementation review checklist included.
Training program materials must pass QA before client distribution.`,

  "acme-d10": `Incident Response Procedure

Severity classification (SEV1–SEV4), communication trees, and 24/7 on-call rotation.
Business continuity activation criteria and disaster recovery coordination steps.
Data breach risk incidents require immediate Risk & Compliance notification and client disclosure assessment.`,

  "acme-d11": `Resource Planning Guide

Capacity model for ERP Modernization and multi-project portfolios. Resource shortage risk triggers
early escalation to Delivery Excellence. Sprint planning uses historical velocity from Jira workflow data.`,

  "acme-d12": `Financial Controls Manual

Budget tracking, forecast variance thresholds, and FinServ compliance reporting for regulated clients.
Budget overrun risk is flagged when forecast exceeds plan by more than 10%.
Executive reporting includes financial KPIs for steering committee review.`,
};
