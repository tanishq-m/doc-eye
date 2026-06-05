export type ConnectorStatus = "available" | "coming-soon";

export interface ConnectorDefinition {
  id: string;
  name: string;
  blurb: string;
  category: "source" | "ai";
  status: ConnectorStatus;
  icon: string;
}

export const SOURCE_CONNECTORS: ConnectorDefinition[] = [
  {
    id: "jira",
    name: "Jira",
    blurb: "Pull issues, epics, and project docs into your org knowledge base.",
    category: "source",
    status: "available",
    icon: "J",
  },
  {
    id: "sharepoint",
    name: "SharePoint",
    blurb: "Ingest files and pages from SharePoint libraries.",
    category: "source",
    status: "available",
    icon: "S",
  },
  {
    id: "confluence",
    name: "Confluence",
    blurb: "Sync spaces and pages as searchable documents.",
    category: "source",
    status: "available",
    icon: "C",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    blurb: "Import Docs and files from shared drives.",
    category: "source",
    status: "coming-soon",
    icon: "G",
  },
  {
    id: "slack",
    name: "Slack",
    blurb: "Capture pinned knowledge and channel exports.",
    category: "source",
    status: "coming-soon",
    icon: "Sl",
  },
];

export const AI_CONNECTORS: ConnectorDefinition[] = [
  {
    id: "mistral",
    name: "Mistral",
    blurb: "Primary extraction and Q&A provider.",
    category: "ai",
    status: "available",
    icon: "M",
  },
  {
    id: "azure-openai",
    name: "Azure OpenAI",
    blurb: "Enterprise Azure-hosted models for extraction and answers.",
    category: "ai",
    status: "available",
    icon: "Az",
  },
  {
    id: "openai",
    name: "OpenAI",
    blurb: "GPT models for entity extraction and grounded Q&A.",
    category: "ai",
    status: "available",
    icon: "O",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    blurb: "Claude models for long-context document understanding.",
    category: "ai",
    status: "coming-soon",
    icon: "A",
  },
];

export interface ConnectorItem {
  id: string;
  title: string;
  content: string;
  filename: string;
}

export const MOCK_CONNECTOR_ITEMS: Record<string, ConnectorItem[]> = {
  jira: [
    {
      id: "jira-101",
      title: "Incident Response Playbook",
      filename: "incident_response_jira.md",
      content: "Runbook for P1 incidents, escalation paths, and comms templates.",
    },
    {
      id: "jira-102",
      title: "Sprint Risk Register",
      filename: "sprint_risks.md",
      content: "Tracked delivery risks, owners, and mitigation actions per sprint.",
    },
  ],
  sharepoint: [
    {
      id: "sp-201",
      title: "Vendor Security Policy",
      filename: "vendor_security.docx",
      content: "Third-party security requirements and assessment workflow.",
    },
    {
      id: "sp-202",
      title: "Architecture Decision Record",
      filename: "adr_cloud.md",
      content: "Cloud migration ADR with dependencies and rollback strategy.",
    },
  ],
  confluence: [
    {
      id: "cf-301",
      title: "Onboarding Handbook",
      filename: "onboarding_handbook.md",
      content: "New hire onboarding steps, systems access, and compliance checkpoints.",
    },
  ],
};

export function getConnectorById(id: string): ConnectorDefinition | undefined {
  return [...SOURCE_CONNECTORS, ...AI_CONNECTORS].find((c) => c.id === id);
}
