export interface UploadedDocument {
  id: string;
  title: string;
  filename: string;
  content: string;
  uploadedAt: string;
}

export interface SearchResult {
  id: string;
  title: string;
  filename: string;
  content: string;
  score: number;
}

export interface QueryResponse {
  answer: string;
  sources: { title: string; filename: string }[];
  confidence: "high" | "medium" | "low";
}

export interface ProcessPlan {
  title: string;
  steps: string[];
  requiredInputs: string[];
  dependencies: string[];
  validationChecklist: string[];
}

export interface KnowledgeGap {
  referencedDocument: string;
  referencedBy: string[];
  businessImpact: string;
  generatedDraft: string;
}

export interface GapsResponse {
  gaps: KnowledgeGap[];
}

export type EntityType =
  | "Client"
  | "Project"
  | "Team"
  | "Process"
  | "Risk"
  | "Dependency"
  | "Document";

export interface Entity {
  id: string;
  label: string;
  type: EntityType;
  docIds: string[];
  mentions: number;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface ReadinessScore {
  completeness: number;
  quality: number;
  connectivity: number;
  metadata: number;
  overall: number;
}

export interface ReadinessSnapshot {
  at: string;
  overall: number;
}

export interface SmartGap {
  id: string;
  title: string;
  severity: "critical" | "warning" | "info";
  narrative: string;
  impactedDocs: string[];
  draft?: string;
}

export interface OrgExportCredentials {
  apiKey: string;
  createdAt: string;
}

export interface OrgExportSummary {
  id: string;
  name: string;
  isDemo: boolean;
  aiProvider: string;
  score: ReadinessScore;
  documentCount: number;
  entityCount: number;
  relationshipCount: number;
  gapCount: number;
}

export interface OrgExportBundle {
  version: string;
  exportedAt: string;
  org: OrgExportSummary;
  documents: UploadedDocument[];
  entities: Entity[];
  relationships: Relationship[];
  gaps: SmartGap[];
  history: ReadinessSnapshot[];
}

export type PersonaType =
  | "leadership"
  | "engineer"
  | "hr"
  | "compliance"
  | "customer"
  | "custom";

export interface InstructionFile {
  id: string;
  orgId: string;
  content: string;
  lastEdited: string;
  editedBy?: string;
}

export interface Persona {
  id: string;
  orgId: string;
  name: string;
  type: PersonaType;
  description: string;
  isBuiltIn?: boolean;
  searchFilters?: {
    prioritizeDocTypes?: string[];
    excludeDocTypes?: string[];
    excludeKeywords?: string[];
  };
  responseTemplate?: "executive" | "technical" | "detailed" | "summary" | "custom";
  systemPromptAppend?: string;
  maskSensitiveData?: boolean;
  maskPatterns?: string[];
}

export interface Org {
  id: string;
  name: string;
  createdAt: string;
  isDemo: boolean;
  aiProvider?: string;
  documents: UploadedDocument[];
  entities: Entity[];
  relationships: Relationship[];
  gaps: SmartGap[];
  /** Gap IDs the user resolved; excluded from automatic re-detection. */
  dismissedGapIds?: string[];
  /** Placeholder export credentials for external AI agent connectors. */
  exportCredentials?: OrgExportCredentials;
  score: ReadinessScore;
  history: ReadinessSnapshot[];
  instructions?: InstructionFile;
  personas?: Persona[];
  defaultPersonaId?: string;
}

export interface ExtractedGraph {
  entities: Entity[];
  relationships: Relationship[];
}
