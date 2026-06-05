import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { recomputeOrgGaps } from "@/lib/gapDetector";
import { generateExportApiKey } from "@/lib/orgExport";
import { computeScore, snapshot } from "@/lib/readiness";
import { seedDemoOrgs } from "@/lib/mockData";
import type {
  Entity,
  ExtractedGraph,
  InstructionFile,
  Org,
  Persona,
  Relationship,
  UploadedDocument,
} from "@/types";
import { buildDefaultPersonas } from "@/lib/demoPersonas";

export interface CorpusState {
  orgs: Record<string, Org>;
  activeOrgId: string | null;
  initialized: boolean;
  init: () => void;
  createOrg: (name: string) => string;
  renameOrg: (id: string, name: string) => boolean;
  switchOrg: (id: string) => void;
  deleteOrg: (id: string) => boolean;
  getActiveOrg: () => Org | null;
  addDocument: (
    orgId: string,
    doc: UploadedDocument,
    extracted: ExtractedGraph
  ) => void;
  acceptGap: (
    orgId: string,
    gapId: string,
    options?: { draftContent?: string }
  ) => void;
  resolveGapByUpload: (
    orgId: string,
    gapId: string,
    doc: UploadedDocument,
    extracted: ExtractedGraph
  ) => void;
  refreshGaps: (orgId: string) => void;
  ensureExportCredentials: (orgId: string) => void;
  regenerateExportCredentials: (orgId: string) => void;
  setAiProvider: (orgId: string, providerId: string) => void;
  updateInstructions: (orgId: string, content: string) => void;
  addPersona: (orgId: string, persona: Omit<Persona, "orgId">) => void;
  updatePersona: (orgId: string, personaId: string, updates: Partial<Persona>) => void;
  deletePersona: (orgId: string, personaId: string) => void;
  setDefaultPersona: (orgId: string, personaId: string) => void;
  resetForTests: () => void;
}

function emptyOrg(name: string, id?: string): Org {
  const orgId = id ?? uuidv4();
  const org: Org = {
    id: orgId,
    name,
    createdAt: new Date().toISOString(),
    isDemo: false,
    aiProvider: "mistral",
    documents: [],
    entities: [],
    relationships: [],
    gaps: [],
    score: { completeness: 0, quality: 0, connectivity: 0, metadata: 0, overall: 0 },
    history: [],
    personas: buildDefaultPersonas(orgId),
    defaultPersonaId: `${orgId}-persona-default`,
  };
  org.score = computeScore(org);
  org.history = [snapshot(org)];
  return org;
}

function mergeEntities(existing: Entity[], incoming: Entity[]): Entity[] {
  const map = new Map<string, Entity>();
  for (const e of existing) map.set(e.id, { ...e });
  for (const e of incoming) {
    const prev = map.get(e.id);
    if (prev) {
      const docIds = Array.from(new Set([...prev.docIds, ...e.docIds]));
      map.set(e.id, {
        ...prev,
        docIds,
        mentions: Math.max(prev.mentions, e.mentions),
      });
    } else {
      map.set(e.id, { ...e });
    }
  }
  return Array.from(map.values());
}

function mergeRelationships(
  existing: Relationship[],
  incoming: Relationship[]
): Relationship[] {
  const map = new Map<string, Relationship>();
  for (const r of existing) map.set(r.id, r);
  for (const r of incoming) {
    if (!map.has(r.id)) map.set(r.id, r);
  }
  return Array.from(map.values());
}

const memoryStorage = new Map<string, string>();

function createAppStorage(): StateStorage {
  if (
    typeof window !== "undefined" &&
    typeof window.localStorage?.getItem === "function" &&
    typeof window.localStorage?.setItem === "function"
  ) {
    return window.localStorage;
  }
  return {
    getItem: (name) => memoryStorage.get(name) ?? null,
    setItem: (name, value) => {
      memoryStorage.set(name, value);
    },
    removeItem: (name) => {
      memoryStorage.delete(name);
    },
  };
}

function recomputeOrg(org: Org, options?: { refreshGaps?: boolean }): Org {
  const withGaps = options?.refreshGaps
    ? { ...org, gaps: recomputeOrgGaps(org) }
    : org;
  const score = computeScore(withGaps);
  const next: Org = { ...withGaps, score };
  const lastOverall = org.history.at(-1)?.overall ?? 0;
  if (score.overall !== lastOverall) {
    next.history = [...org.history, snapshot(next)];
  }
  return next;
}

export const useCorpusStore = create<CorpusState>()(
  persist(
    (set, get) => ({
      orgs: {},
      activeOrgId: null,
      initialized: false,

      init: () => {
        const demos = seedDemoOrgs();
        const staleDemoIds = ["demo-globex-advisory", "demo-nexus-partners"];

        set((state) => {
          const orgs = { ...state.orgs };
          for (const id of staleDemoIds) delete orgs[id];

          for (const demo of demos) {
            const existing = orgs[demo.id];
            orgs[demo.id] = existing
              ? {
                  ...demo,
                  exportCredentials: existing.exportCredentials ?? demo.exportCredentials,
                }
              : demo;
          }

          let activeOrgId = state.activeOrgId;
          if (!activeOrgId || !orgs[activeOrgId] || staleDemoIds.includes(activeOrgId)) {
            activeOrgId = demos[0]?.id ?? null;
          }

          return { orgs, activeOrgId, initialized: true };
        });

        if (typeof window !== "undefined") {
          void fetch("/api/demo-corpus/seed", { method: "POST" }).catch(() => {});
        }
      },

      createOrg: (name) => {
        const trimmed = name.trim();
        const org = emptyOrg(trimmed.length >= 2 ? trimmed : "New Organization");
        set((state) => ({
          orgs: { ...state.orgs, [org.id]: org },
          activeOrgId: org.id,
        }));
        return org.id;
      },

      renameOrg: (id, name) => {
        const trimmed = name.trim();
        if (trimmed.length < 2) return false;
        const org = get().orgs[id];
        if (!org || org.isDemo) return false;
        set((state) => ({
          orgs: {
            ...state.orgs,
            [id]: { ...org, name: trimmed },
          },
        }));
        return true;
      },

      switchOrg: (id) => {
        if (!get().orgs[id]) return;
        set({ activeOrgId: id });
      },

      deleteOrg: (id) => {
        const org = get().orgs[id];
        if (!org || org.isDemo) return false;

        set((state) => {
          const rest = { ...state.orgs };
          delete rest[id];
          const ids = Object.keys(rest);
          const activeOrgId =
            state.activeOrgId === id ? (ids[0] ?? null) : state.activeOrgId;
          return { orgs: rest, activeOrgId };
        });
        return true;
      },

      getActiveOrg: () => {
        const { activeOrgId, orgs } = get();
        return activeOrgId ? (orgs[activeOrgId] ?? null) : null;
      },

      addDocument: (orgId, doc, extracted) => {
        set((state) => {
          const org = state.orgs[orgId];
          if (!org) return state;

          const updated: Org = {
            ...org,
            documents: [...org.documents, doc],
            entities: mergeEntities(org.entities, extracted.entities),
            relationships: mergeRelationships(org.relationships, extracted.relationships),
          };
          const next = recomputeOrg(updated, { refreshGaps: true });
          return { orgs: { ...state.orgs, [orgId]: next } };
        });
      },

      refreshGaps: (orgId) => {
        set((state) => {
          const org = state.orgs[orgId];
          if (!org || org.isDemo) return state;
          const next = recomputeOrg(org, { refreshGaps: true });
          return { orgs: { ...state.orgs, [orgId]: next } };
        });
      },

      ensureExportCredentials: (orgId) => {
        set((state) => {
          const org = state.orgs[orgId];
          if (!org || org.exportCredentials) return state;
          return {
            orgs: {
              ...state.orgs,
              [orgId]: {
                ...org,
                exportCredentials: {
                  apiKey: generateExportApiKey(),
                  createdAt: new Date().toISOString(),
                },
              },
            },
          };
        });
      },

      regenerateExportCredentials: (orgId) => {
        set((state) => {
          const org = state.orgs[orgId];
          if (!org) return state;
          return {
            orgs: {
              ...state.orgs,
              [orgId]: {
                ...org,
                exportCredentials: {
                  apiKey: generateExportApiKey(),
                  createdAt: new Date().toISOString(),
                },
              },
            },
          };
        });
      },

      acceptGap: (orgId, gapId, options) => {
        set((state) => {
          const org = state.orgs[orgId];
          if (!org) return state;

          const gap = org.gaps.find((g) => g.id === gapId);
          if (!gap) return state;

          const draftDoc: UploadedDocument | null = options?.draftContent
            ? {
                id: `gap-doc-${gapId}`,
                title: gap.title,
                filename: `${gap.title.replace(/\s+/g, "_").toLowerCase()}.md`,
                content: options.draftContent,
                uploadedAt: new Date().toISOString(),
              }
            : null;

          const entityId = `gap-fill-${gapId}`;
          const newEntity: Entity = {
            id: entityId,
            label: gap.title,
            type: "Document",
            docIds: draftDoc ? [draftDoc.id] : [],
            mentions: draftDoc ? 3 : 1,
          };

          const newRelationships: Relationship[] = gap.impactedDocs.map((docTitle, i) => ({
            id: `gap-rel-${gapId}-${i}`,
            source: entityId,
            target:
              org.entities.find((e) =>
                org.documents.some(
                  (d) => d.title === docTitle && e.docIds.includes(d.id)
                )
              )?.id ?? org.entities[0]?.id ?? entityId,
            label: "closes_gap",
          }));

          const updated: Org = {
            ...org,
            documents: draftDoc ? [...org.documents, draftDoc] : org.documents,
            gaps: org.gaps.filter((g) => g.id !== gapId),
            dismissedGapIds: [...(org.dismissedGapIds ?? []), gapId],
            entities: mergeEntities(org.entities, [newEntity]),
            relationships: mergeRelationships(org.relationships, newRelationships),
          };
          const next = recomputeOrg(updated);
          return { orgs: { ...state.orgs, [orgId]: next } };
        });
      },

      resolveGapByUpload: (orgId, gapId, doc, extracted) => {
        set((state) => {
          const org = state.orgs[orgId];
          if (!org) return state;
          if (!org.gaps.some((g) => g.id === gapId)) return state;

          const updated: Org = {
            ...org,
            documents: [...org.documents, doc],
            entities: mergeEntities(org.entities, extracted.entities),
            relationships: mergeRelationships(org.relationships, extracted.relationships),
            gaps: org.gaps.filter((g) => g.id !== gapId),
            dismissedGapIds: [...(org.dismissedGapIds ?? []), gapId],
          };
          const next = recomputeOrg(updated, { refreshGaps: true });
          return { orgs: { ...state.orgs, [orgId]: next } };
        });
      },

      setAiProvider: (orgId, providerId) => {
        set((state) => {
          const org = state.orgs[orgId];
          if (!org) return state;
          return {
            orgs: {
              ...state.orgs,
              [orgId]: { ...org, aiProvider: providerId },
            },
          };
        });
      },

      updateInstructions: (orgId, content) => {
        set((state) => {
          const org = state.orgs[orgId];
          if (!org) return state;
          const instructions: InstructionFile = {
            id: org.instructions?.id ?? uuidv4(),
            orgId,
            content,
            lastEdited: new Date().toISOString(),
          };
          return { orgs: { ...state.orgs, [orgId]: { ...org, instructions } } };
        });
      },

      addPersona: (orgId, persona) => {
        set((state) => {
          const org = state.orgs[orgId];
          if (!org) return state;
          const full: Persona = { ...persona, id: (persona as Persona).id ?? uuidv4(), orgId };
          return { orgs: { ...state.orgs, [orgId]: { ...org, personas: [...(org.personas ?? []), full] } } };
        });
      },

      updatePersona: (orgId, personaId, updates) => {
        set((state) => {
          const org = state.orgs[orgId];
          if (!org) return state;
          return {
            orgs: {
              ...state.orgs,
              [orgId]: {
                ...org,
                personas: (org.personas ?? []).map((p) =>
                  p.id === personaId ? { ...p, ...updates } : p
                ),
              },
            },
          };
        });
      },

      deletePersona: (orgId, personaId) => {
        set((state) => {
          const org = state.orgs[orgId];
          if (!org) return state;
          return {
            orgs: {
              ...state.orgs,
              [orgId]: {
                ...org,
                personas: (org.personas ?? []).filter((p) => p.id !== personaId),
                defaultPersonaId:
                  org.defaultPersonaId === personaId
                    ? (org.personas ?? []).find((p) => p.id !== personaId)?.id
                    : org.defaultPersonaId,
              },
            },
          };
        });
      },

      setDefaultPersona: (orgId, personaId) => {
        set((state) => {
          const org = state.orgs[orgId];
          if (!org) return state;
          return { orgs: { ...state.orgs, [orgId]: { ...org, defaultPersonaId: personaId } } };
        });
      },

      resetForTests: () => {
        memoryStorage.clear();
        useCorpusStore.persist.clearStorage();
        set({ orgs: {}, activeOrgId: null, initialized: false });
      },
    }),
    {
      name: "doc-eye-corpus",
      storage: createJSONStorage(() => createAppStorage()),
      partialize: (state) => ({
        orgs: state.orgs,
        activeOrgId: state.activeOrgId,
        initialized: state.initialized,
      }),
    }
  )
);
