import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GapsPage from "@/app/o/[orgId]/gaps/page";
import { useCorpusStore } from "@/store/corpus";
import { DEMO_GAP_FIXTURES } from "@/lib/mockData";

const navState = { orgId: "demo-acme-consulting" };

vi.mock("next/navigation", () => ({
  useParams: () => ({ orgId: navState.orgId }),
}));

describe("gaps UI", () => {
  beforeEach(() => {
    useCorpusStore.getState().resetForTests();
    useCorpusStore.getState().init();
    navState.orgId = "demo-acme-consulting";
    const acme = useCorpusStore.getState().orgs["demo-acme-consulting"];
    useCorpusStore.setState({
      orgs: {
        ...useCorpusStore.getState().orgs,
        "demo-acme-consulting": { ...acme, gaps: [...DEMO_GAP_FIXTURES] },
      },
    });
  });

  it("renders gaps sorted by severity (critical first)", () => {
    render(<GapsPage />);
    const list = screen.getByTestId("gap-list");
    const cards = within(list).getAllByRole("article");
    expect(cards.length).toBe(DEMO_GAP_FIXTURES.length);

    const severities = cards.map(
      (card) => card.querySelector("span.uppercase")?.textContent?.toLowerCase() ?? ""
    );
    const order = { critical: 0, warning: 1, info: 2 };
    for (let i = 1; i < severities.length; i++) {
      expect(order[severities[i] as keyof typeof order]).toBeGreaterThanOrEqual(
        order[severities[i - 1] as keyof typeof order]
      );
    }
  });

  it("shows score breakdown when no gaps but score is below full", () => {
    const orgId = useCorpusStore.getState().createOrg("Low Score Org");
    navState.orgId = orgId;

    useCorpusStore.getState().addDocument(
      orgId,
      {
        id: "d-0",
        title: "Doc 0",
        filename: "d-0.md",
        content: "content",
        uploadedAt: new Date().toISOString(),
      },
      {
        entities: [
          { id: "e-0", label: "Entity 0", type: "Client", docIds: ["d-0"], mentions: 2 },
          { id: "e-1", label: "Entity 1", type: "Project", docIds: ["d-0"], mentions: 2 },
        ],
        relationships: [{ id: "r-0", source: "e-0", target: "e-1", label: "owns" }],
      }
    );
    useCorpusStore.getState().addDocument(
      orgId,
      {
        id: "d-1",
        title: "Doc 1",
        filename: "d-1.md",
        content: "more content",
        uploadedAt: new Date().toISOString(),
      },
      {
        entities: [{ id: "e-2", label: "Entity 2", type: "Team", docIds: ["d-1"], mentions: 2 }],
        relationships: [
          { id: "r-1", source: "e-1", target: "e-2", label: "staffs" },
        ],
      }
    );

    render(<GapsPage />);
    expect(screen.getByTestId("gaps-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("gaps-score-breakdown")).toBeInTheDocument();
  });

  it("accepting a gap removes it and extends history", async () => {
    const user = userEvent.setup();
    const acmeId = "demo-acme-consulting";
    const historyBefore = useCorpusStore.getState().orgs[acmeId].history.length;
    const entitiesBefore = useCorpusStore.getState().orgs[acmeId].entities.length;
    const firstGap = DEMO_GAP_FIXTURES[0];

    render(<GapsPage />);
    expect(screen.getByTestId(`gap-card-${firstGap.id}`)).toBeInTheDocument();

    await user.click(screen.getByTestId(`accept-gap-${firstGap.id}`));

    await waitFor(() => {
      expect(screen.queryByTestId(`gap-card-${firstGap.id}`)).not.toBeInTheDocument();
    });

    const org = useCorpusStore.getState().orgs[acmeId];
    expect(org.gaps).toHaveLength(DEMO_GAP_FIXTURES.length - 1);
    expect(org.entities.length).toBeGreaterThan(entitiesBefore);
    expect(org.history.length).toBeGreaterThanOrEqual(historyBefore);
    expect(screen.getByTestId("gaps-overall-score")).toHaveTextContent(String(org.score.overall));
  });
});
