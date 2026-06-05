import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "@/app/o/[orgId]/dashboard/page";
import UploadPage from "@/app/o/[orgId]/upload/page";
import AskPage from "@/app/o/[orgId]/ask/page";
import { useCorpusStore } from "@/store/corpus";

const navState = { orgId: "" };

vi.mock("next/navigation", () => ({
  useParams: () => ({ orgId: navState.orgId }),
}));

const uploadDocument = vi.fn();

vi.mock("@/lib/uploadClient", () => ({
  uploadDocument: (...args: unknown[]) => uploadDocument(...args),
}));

vi.mock("@/lib/askClient", () => ({
  askQuestion: vi.fn(),
}));

describe("Phase 7.4 — demo flow CTAs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCorpusStore.getState().resetForTests();
    navState.orgId = useCorpusStore.getState().createOrg("Demo Flow Org");
  });

  it("dashboard with a 0-doc org renders dashboard-empty-cta", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("dashboard-empty-cta")).toBeInTheDocument();
    expect(screen.getByText("Upload documents")).toBeInTheDocument();
    expect(screen.getByText("Try a demo org")).toBeInTheDocument();
  });

  it("upload page shows post-upload graph and gaps links after success", async () => {
    const user = userEvent.setup();
    const orgId = navState.orgId;

    uploadDocument.mockResolvedValue({
      doc: {
        id: "up-1",
        title: "Memo",
        filename: "memo.md",
        content: "content",
        uploadedAt: new Date().toISOString(),
      },
      extracted: {
        entities: [
          { id: "e1", label: "Memo", type: "Document", docIds: ["up-1"], mentions: 1 },
        ],
        relationships: [],
      },
      usedMockFallback: false,
    });

    render(<UploadPage />);
    const file = new File(["memo"], "memo.md", { type: "text/markdown" });
    await user.upload(screen.getByTestId("upload-input"), file);

    await waitFor(() => {
      expect(screen.getByTestId("processing-complete")).toBeInTheDocument();
    });

    expect(screen.getByTestId("post-upload-graph")).toHaveAttribute(
      "href",
      `/o/${orgId}/graph`
    );
    expect(screen.getByTestId("post-upload-gaps")).toHaveAttribute(
      "href",
      `/o/${orgId}/gaps`
    );
  });

  it("ask starter chip fills the input", async () => {
    const user = userEvent.setup();
    const orgId = navState.orgId;
    useCorpusStore.getState().addDocument(
      orgId,
      {
        id: "d1",
        title: "Policy",
        filename: "policy.md",
        content: "Policy content",
        uploadedAt: new Date().toISOString(),
      },
      {
        entities: [
          { id: "e1", label: "Policy", type: "Process", docIds: ["d1"], mentions: 2 },
        ],
        relationships: [],
      }
    );

    render(<AskPage />);
    await user.click(screen.getByTestId("ask-starter-0"));
    expect(screen.getByTestId("ask-input")).toHaveValue(
      "What is Acme's current Net Revenue Retention and where is it documented?"
    );
  });
});
