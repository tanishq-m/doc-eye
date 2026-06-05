import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExportPage from "@/app/o/[orgId]/export/page";
import { useCorpusStore } from "@/store/corpus";
import { triggerJsonDownload } from "@/lib/orgExport";

const navState = { orgId: "" };

vi.mock("@/lib/orgExport", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/orgExport")>();
  return {
    ...actual,
    triggerJsonDownload: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useParams: () => ({ orgId: navState.orgId }),
}));

describe("export page", () => {
  beforeEach(() => {
    useCorpusStore.getState().resetForTests();
    const orgId = useCorpusStore.getState().createOrg("Export Org");
    navState.orgId = orgId;

    useCorpusStore.getState().addDocument(
      orgId,
      {
        id: "d1",
        title: "Handbook",
        filename: "handbook.md",
        content: "Team handbook content.",
        uploadedAt: new Date().toISOString(),
      },
      {
        entities: [
          { id: "e1", label: "Handbook", type: "Document", docIds: ["d1"], mentions: 2 },
        ],
        relationships: [],
      }
    );

    useCorpusStore.getState().ensureExportCredentials(orgId);
  });

  it("shows data stats and generates connector credentials", async () => {
    render(<ExportPage />);

    await waitFor(() => {
      expect(screen.getByTestId("export-stats")).toBeInTheDocument();
    });

    expect(screen.getByTestId("export-stats")).toHaveTextContent("Documents");
    expect(screen.getByTestId("export-connector-url")).toBeInTheDocument();
    expect(screen.getByTestId("export-api-key")).toBeInTheDocument();
    expect(screen.getByTestId("export-api-key").textContent).toMatch(/^doc-eye_/);
  });

  it("lists external AI agent cards", () => {
    render(<ExportPage />);
    expect(screen.getByTestId("export-ai-agents")).toBeInTheDocument();
    expect(screen.getByTestId("export-agent-claude")).toBeInTheDocument();
    expect(screen.getByTestId("export-agent-chatgpt")).toBeInTheDocument();
    expect(screen.getByTestId("export-agent-gemini")).toBeInTheDocument();
    expect(screen.getByTestId("export-agent-codex")).toBeInTheDocument();
  });

  it("expands agent card to show setup snippet", async () => {
    const user = userEvent.setup();
    render(<ExportPage />);

    await waitFor(() => {
      expect(screen.getByTestId("export-api-key")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("export-agent-claude"));

    await waitFor(() => {
      expect(screen.getByTestId("export-snippet-claude")).toBeInTheDocument();
    });
  });

  it("triggers JSON download on export button", async () => {
    const user = userEvent.setup();
    render(<ExportPage />);
    await user.click(screen.getByTestId("export-download-btn"));
    expect(triggerJsonDownload).toHaveBeenCalledWith(
      expect.stringMatching(/^doc-eye-export-org/),
      expect.objectContaining({ version: "1.0" })
    );
  });
});
