import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GapsPage from "@/app/o/[orgId]/gaps/page";
import { explainGap } from "@/lib/gapResolve";
import { useCorpusStore } from "@/store/corpus";
import { DEMO_GAP_FIXTURES, seedDemoOrgs } from "@/lib/mockData";

vi.mock("next/navigation", () => ({
  useParams: () => ({ orgId: "demo-acme-consulting" }),
}));

vi.mock("@/lib/ai", () => ({
  generateDocumentDraft: vi.fn(async (title: string) => `AI draft for ${title}`),
}));

describe("gap resolve", () => {
  const org = seedDemoOrgs().find((o) => o.id === "demo-acme-consulting")!;
  const gap = DEMO_GAP_FIXTURES[0];

  beforeEach(() => {
    vi.clearAllMocks();
    useCorpusStore.getState().resetForTests();
    useCorpusStore.getState().init();
    const acme = useCorpusStore.getState().orgs["demo-acme-consulting"];
    useCorpusStore.setState({
      orgs: {
        ...useCorpusStore.getState().orgs,
        "demo-acme-consulting": { ...acme, gaps: [...DEMO_GAP_FIXTURES] },
      },
    });
    global.fetch = vi.fn().mockRejectedValue(new Error("offline"));
  });

  it("explainGap states what, why, impact, and triggers", () => {
    const explanation = explainGap(gap);
    expect(explanation.what).toContain(gap.title);
    expect(explanation.why).toContain(gap.severity);
    expect(explanation.impact).toBe(gap.narrative);
    expect(explanation.triggers).toEqual(gap.impactedDocs);
  });

  it("expanding a gap shows explanation", async () => {
    const user = userEvent.setup();
    render(<GapsPage />);
    await user.click(screen.getByTestId(`expand-gap-${gap.id}`));
    const panel = screen.getByTestId(`gap-explanation-${gap.id}`);
    expect(within(panel).getByText(/What's missing/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Why flagged/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Impact/i)).toBeInTheDocument();
  });

  it("generate draft renders editable field and accepts edited text", async () => {
    const user = userEvent.setup();

    render(<GapsPage />);
    await user.click(screen.getByTestId(`expand-gap-${gap.id}`));
    await user.click(screen.getByTestId(`generate-draft-${gap.id}`));

    const textarea = await screen.findByTestId(`gap-draft-${gap.id}`);
    expect((textarea as HTMLTextAreaElement).value).toContain("AI draft for");

    await user.clear(textarea);
    await user.type(textarea, "My edited gap coverage draft");
    await user.click(screen.getByTestId(`accept-draft-${gap.id}`));

    await waitFor(() => {
      expect(screen.queryByTestId(`gap-card-${gap.id}`)).not.toBeInTheDocument();
    });

    const state = useCorpusStore.getState().orgs["demo-acme-consulting"];
    expect(state.gaps.some((g) => g.id === gap.id)).toBe(false);
    expect(state.documents.some((d) => d.content.includes("My edited gap coverage draft"))).toBe(
      true
    );
    expect(state.history.length).toBeGreaterThan(org.history.length);
  });

  it("per-gap upload control closes gap for active org only", async () => {
    const user = userEvent.setup();
    const file = new File(["gap fix content"], "risk-mitigation.md", { type: "text/markdown" });

    render(<GapsPage />);
    await user.click(screen.getByTestId(`expand-gap-${gap.id}`));

    const input = screen.getByTestId(`upload-gap-input-${gap.id}`);
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.queryByTestId(`gap-card-${gap.id}`)).not.toBeInTheDocument();
    });

    const acme = useCorpusStore.getState().orgs["demo-acme-consulting"];
    expect(acme.gaps.some((g) => g.id === gap.id)).toBe(false);
    expect(acme.documents.some((d) => d.filename === "risk-mitigation.md")).toBe(true);

    const otherId = useCorpusStore.getState().createOrg("Gap Isolation Org");
    useCorpusStore.setState({
      orgs: {
        ...useCorpusStore.getState().orgs,
        [otherId]: {
          ...useCorpusStore.getState().orgs[otherId],
          gaps: [
            {
              id: "other-g1",
              title: "Other Gap",
              severity: "info",
              narrative: "Isolation check",
              impactedDocs: [],
            },
          ],
        },
      },
    });
    expect(useCorpusStore.getState().orgs[otherId].gaps).toHaveLength(1);
  });
});
