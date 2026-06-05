import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AskPage from "@/app/o/[orgId]/ask/page";
import { useCorpusStore } from "@/store/corpus";

const navState = { orgId: "" };

vi.mock("next/navigation", () => ({
  useParams: () => ({ orgId: navState.orgId }),
}));

const askQuestion = vi.fn();

vi.mock("@/lib/askClient", () => ({
  askQuestion: (...args: unknown[]) => askQuestion(...args),
}));

describe("ask page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCorpusStore.getState().resetForTests();
    const orgId = useCorpusStore.getState().createOrg("Ask Test Org");
    navState.orgId = orgId;

    useCorpusStore.getState().addDocument(
      orgId,
      {
        id: "doc-1",
        title: "Security Policy",
        filename: "security.md",
        content: "All teams must follow the incident response procedure.",
        uploadedAt: new Date().toISOString(),
      },
      {
        entities: [
          {
            id: "e1",
            label: "Security Policy",
            type: "Process",
            docIds: ["doc-1"],
            mentions: 4,
          },
        ],
        relationships: [],
      }
    );
  });

  it("submits question with active orgId and renders answer", async () => {
    const user = userEvent.setup();
    askQuestion.mockResolvedValue({
      answer: "Follow the incident response procedure.",
      sources: [{ title: "Security Policy", filename: "security.md" }],
      confidence: "high",
    });

    render(<AskPage />);
    await user.type(screen.getByTestId("ask-input"), "What is the security policy?");
    await user.click(screen.getByTestId("ask-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("ask-response")).toBeInTheDocument();
    });

    expect(askQuestion).toHaveBeenCalledWith(
      navState.orgId,
      "What is the security policy?",
      expect.arrayContaining([expect.objectContaining({ id: "doc-1" })]),
      expect.objectContaining({ orgName: "Ask Test Org" })
    );
    expect(screen.getByText(/incident response procedure/i)).toBeInTheDocument();
    const card = screen.getByTestId("response-card");
    expect(card).toBeInTheDocument();
    expect(card.outerHTML).not.toMatch(/slate-/);
  });

  it("shows empty state when org has no documents", () => {
    const emptyId = useCorpusStore.getState().createOrg("Empty Ask Org");
    navState.orgId = emptyId;
    render(<AskPage />);
    expect(screen.getByTestId("ask-empty-state")).toBeInTheDocument();
  });
});
