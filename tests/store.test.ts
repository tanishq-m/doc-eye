import { beforeEach, describe, it, expect } from "vitest";
import { useCorpusStore } from "@/store/corpus";
import type { ExtractedGraph, UploadedDocument } from "@/types";

beforeEach(() => {
  useCorpusStore.getState().resetForTests();
});

describe("corpus store", () => {
  it("init seeds demo orgs", () => {
    useCorpusStore.getState().init();
    const { orgs, activeOrgId } = useCorpusStore.getState();
    expect(Object.keys(orgs).length).toBe(1);
    expect(activeOrgId).toBe("demo-acme-consulting");
    expect(Object.values(orgs).every((o) => o.isDemo)).toBe(true);
  });

  it("createOrg adds an isolated empty org", () => {
    useCorpusStore.getState().init();
    const before = { ...useCorpusStore.getState().orgs };
    const newId = useCorpusStore.getState().createOrg("Judge Org");
    const after = useCorpusStore.getState().orgs;

    expect(after[newId]).toBeDefined();
    expect(after[newId].isDemo).toBe(false);
    expect(after[newId].entities).toHaveLength(0);
    expect(Object.keys(before).every((id) => after[id] === before[id])).toBe(true);
  });

  it("addDocument grows entities and raises overall score", () => {
    const orgId = useCorpusStore.getState().createOrg("Upload Test");
    const beforeScore = useCorpusStore.getState().orgs[orgId].score.overall;

    const doc: UploadedDocument = {
      id: "doc-1",
      title: "New Policy",
      filename: "policy.md",
      content: "content",
      uploadedAt: new Date().toISOString(),
    };
    const extracted: ExtractedGraph = {
      entities: [
        { id: "ent-1", label: "Policy A", type: "Process", docIds: ["doc-1"], mentions: 4 },
        { id: "ent-2", label: "Risk B", type: "Risk", docIds: ["doc-1"], mentions: 3 },
      ],
      relationships: [{ id: "rel-1", source: "ent-1", target: "ent-2", label: "mitigates" }],
    };

    useCorpusStore.getState().addDocument(orgId, doc, extracted);
    const org = useCorpusStore.getState().orgs[orgId];

    expect(org.documents).toHaveLength(1);
    expect(org.entities.length).toBeGreaterThanOrEqual(2);
    expect(org.relationships).toHaveLength(1);
    expect(org.score.overall).toBeGreaterThanOrEqual(beforeScore);
  });

  it("addDocument refreshes gaps for non-demo orgs", () => {
    const orgId = useCorpusStore.getState().createOrg("Gap Scan Org");

    const makeDoc = (id: string, title: string, content: string): UploadedDocument => ({
      id,
      title,
      filename: `${id}.md`,
      content,
      uploadedAt: new Date().toISOString(),
    });

    for (let i = 1; i <= 3; i++) {
      useCorpusStore.getState().addDocument(
        orgId,
        makeDoc(`doc-${i}`, `Doc ${i}`, "General content."),
        {
          entities: [
            {
              id: `ent-${i}`,
              label: `Entity ${i}`,
              type: "Client",
              docIds: [`doc-${i}`],
              mentions: 2,
            },
          ],
          relationships: [],
        }
      );
    }

    const org = useCorpusStore.getState().orgs[orgId];
    expect(org.gaps.some((g) => g.id === "connectivity-sparse-graph")).toBe(true);
  });

  it("acceptGap removes gap and extends history", () => {
    const orgId = useCorpusStore.getState().createOrg("Gap Accept Org");
    useCorpusStore.setState({
      orgs: {
        ...useCorpusStore.getState().orgs,
        [orgId]: {
          ...useCorpusStore.getState().orgs[orgId],
          gaps: [
            {
              id: "test-gap-1",
              title: "Missing Runbook",
              severity: "warning",
              narrative: "Referenced but missing.",
              impactedDocs: ["Policy"],
            },
          ],
        },
      },
    });
    const orgBefore = useCorpusStore.getState().orgs[orgId];
    const gapId = orgBefore.gaps[0].id;
    const scoreBefore = orgBefore.score.overall;
    const historyBefore = orgBefore.history.length;
    const entitiesBefore = orgBefore.entities.length;

    useCorpusStore.getState().acceptGap(orgId, gapId);
    const orgAfter = useCorpusStore.getState().orgs[orgId];

    expect(orgAfter.gaps.find((g) => g.id === gapId)).toBeUndefined();
    expect(orgAfter.entities.length).toBeGreaterThan(entitiesBefore);
    expect(orgAfter.history.length).toBeGreaterThanOrEqual(historyBefore);
    expect(orgAfter.score.overall).toBeGreaterThanOrEqual(scoreBefore);
  });

  it("deleteOrg removes only the targeted org", () => {
    useCorpusStore.getState().init();
    const victim = useCorpusStore.getState().createOrg("Temporary");
    const survivorId = Object.keys(useCorpusStore.getState().orgs).find((id) => id !== victim)!;
    const survivorBefore = useCorpusStore.getState().orgs[survivorId];

    expect(useCorpusStore.getState().deleteOrg(victim)).toBe(true);
    expect(useCorpusStore.getState().orgs[victim]).toBeUndefined();
    expect(useCorpusStore.getState().orgs[survivorId]).toEqual(survivorBefore);
  });

  it("renameOrg updates non-demo org name", () => {
    const orgId = useCorpusStore.getState().createOrg("Old Name");
    expect(useCorpusStore.getState().renameOrg(orgId, "New Name")).toBe(true);
    expect(useCorpusStore.getState().orgs[orgId].name).toBe("New Name");
  });

  it("deleteOrg and renameOrg refuse demo orgs", () => {
    useCorpusStore.getState().init();
    const demoId = Object.values(useCorpusStore.getState().orgs).find((o) => o.isDemo)!.id;
    const before = useCorpusStore.getState().orgs[demoId].name;
    expect(useCorpusStore.getState().renameOrg(demoId, "Hacked")).toBe(false);
    expect(useCorpusStore.getState().deleteOrg(demoId)).toBe(false);
    expect(useCorpusStore.getState().orgs[demoId].name).toBe(before);
  });

  it("isolates mutations between org A and org B", () => {
    const orgA = useCorpusStore.getState().createOrg("Org A");
    const orgB = useCorpusStore.getState().createOrg("Org B");

    useCorpusStore.getState().addDocument(
      orgA,
      {
        id: "only-a",
        title: "Only A",
        filename: "a.md",
        content: "a",
        uploadedAt: new Date().toISOString(),
      },
      {
        entities: [{ id: "ea", label: "Entity A", type: "Client", docIds: ["only-a"], mentions: 2 }],
        relationships: [],
      }
    );

    const a = useCorpusStore.getState().orgs[orgA];
    const b = useCorpusStore.getState().orgs[orgB];

    expect(a.documents).toHaveLength(1);
    expect(b.documents).toHaveLength(0);
    expect(a.entities).toHaveLength(1);
    expect(b.entities).toHaveLength(0);
  });

  it("getActiveOrg returns the switched org", () => {
    useCorpusStore.getState().init();
    const otherId = useCorpusStore.getState().createOrg("Switch Target");
    useCorpusStore.getState().switchOrg(otherId);
    expect(useCorpusStore.getState().getActiveOrg()?.id).toBe(otherId);
  });
});
