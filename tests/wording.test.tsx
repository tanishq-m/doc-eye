import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProcessingScreen from "@/components/ProcessingScreen";
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

describe("Phase 7.1 — confident product wording", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCorpusStore.getState().resetForTests();
    navState.orgId = useCorpusStore.getState().createOrg("Wording Org");
    useCorpusStore.getState().addDocument(
      navState.orgId,
      {
        id: "d1",
        title: "Policy",
        filename: "policy.md",
        content: "Policy content about risk.",
        uploadedAt: new Date().toISOString(),
      },
      {
        entities: [
          { id: "e1", label: "Policy", type: "Process", docIds: ["d1"], mentions: 2 },
        ],
        relationships: [],
      }
    );
  });

  it("ProcessingScreen uses offline mode copy instead of live upload unavailable", () => {
    render(
      <ProcessingScreen
        stage="done"
        filename="test.md"
        usedMockFallback
        liveError="Connection refused"
      />
    );
    expect(screen.getByTestId("upload-mock-fallback")).toBeInTheDocument();
    expect(screen.getByTestId("upload-mock-fallback").textContent).not.toContain(
      "Live upload unavailable"
    );
    expect(screen.getByTestId("upload-mock-fallback").textContent).toMatch(/offline mode/i);
    expect(screen.getByTestId("upload-live-error")).toHaveTextContent("Note:");
  });

  it("Ask page uses local knowledge base copy instead of live search unavailable", async () => {
    const user = userEvent.setup();
    askQuestion.mockResolvedValue({
      answer: "Local answer.",
      sources: [],
      confidence: "low",
      usedMockFallback: true,
    });

    render(<AskPage />);
    await user.type(screen.getByTestId("ask-input"), "What are our gaps?");
    await user.click(screen.getByTestId("ask-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("ask-mock-fallback")).toBeInTheDocument();
    });

    expect(screen.getByTestId("ask-mock-fallback").textContent).not.toContain(
      "Live search unavailable"
    );
    expect(screen.getByTestId("ask-mock-fallback").textContent).toMatch(
      /local knowledge base/i
    );
  });
});
