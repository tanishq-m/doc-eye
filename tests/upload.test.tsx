import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UploadPage from "@/app/o/[orgId]/upload/page";
import { useCorpusStore } from "@/store/corpus";

const navState = { orgId: "" };

vi.mock("next/navigation", () => ({
  useParams: () => ({ orgId: navState.orgId }),
}));

const uploadDocument = vi.fn();

vi.mock("@/lib/uploadClient", () => ({
  uploadDocument: (...args: unknown[]) => uploadDocument(...args),
}));

describe("upload page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCorpusStore.getState().resetForTests();
    navState.orgId = useCorpusStore.getState().createOrg("Upload Test Org");
  });

  it("successful upload calls addDocument for active org only", async () => {
    const user = userEvent.setup();
    const orgId = navState.orgId;
    const otherId = useCorpusStore.getState().createOrg("Other Org");
    const beforeEntities = useCorpusStore.getState().orgs[orgId].entities.length;
    const otherBefore = useCorpusStore.getState().orgs[otherId].entities.length;

    uploadDocument.mockResolvedValue({
      doc: {
        id: "up-1",
        title: "Risk Memo",
        filename: "risk.md",
        content: "risk content",
        uploadedAt: new Date().toISOString(),
      },
      extracted: {
        entities: [
          { id: "e1", label: "Risk Memo", type: "Document", docIds: ["up-1"], mentions: 2 },
        ],
        relationships: [],
      },
      usedMockFallback: false,
    });

    render(<UploadPage />);
    const file = new File(["risk"], "risk.md", { type: "text/markdown" });
    await user.upload(screen.getByTestId("upload-input"), file);

    await waitFor(() => {
      expect(screen.getByTestId("processing-complete")).toBeInTheDocument();
    });

    expect(uploadDocument).toHaveBeenCalledWith(orgId, file);
    expect(useCorpusStore.getState().orgs[orgId].entities.length).toBeGreaterThan(
      beforeEntities
    );
    expect(useCorpusStore.getState().orgs[otherId].entities.length).toBe(otherBefore);
    expect(screen.getByTestId("processing-stages")).toBeInTheDocument();
    expect(screen.getByTestId("stage-done").querySelector(".animate-spin")).toBeNull();
  });

  it("uploads multiple files sequentially", async () => {
    const user = userEvent.setup();
    const orgId = navState.orgId;

    uploadDocument.mockImplementation(async (_orgId, file: File) => ({
      doc: {
        id: `up-${file.name}`,
        title: file.name,
        filename: file.name,
        content: "content",
        uploadedAt: new Date().toISOString(),
      },
      extracted: {
        entities: [
          { id: "e1", label: file.name, type: "Document", docIds: [`up-${file.name}`], mentions: 1 },
        ],
        relationships: [],
      },
      usedMockFallback: false,
    }));

    render(<UploadPage />);
    const files = [
      new File(["a"], "a.md", { type: "text/markdown" }),
      new File(["b"], "b.txt", { type: "text/plain" }),
    ];
    await user.upload(screen.getByTestId("upload-input"), files);

    await waitFor(
      () => {
        expect(screen.getByTestId("processing-complete")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(uploadDocument).toHaveBeenCalledTimes(2);
    expect(uploadDocument).toHaveBeenNthCalledWith(1, orgId, files[0]);
    expect(uploadDocument).toHaveBeenNthCalledWith(2, orgId, files[1]);
    expect(screen.getByTestId("upload-another")).toBeInTheDocument();
  });

  it("mock fallback still completes processing UI", async () => {
    const user = userEvent.setup();
    uploadDocument.mockResolvedValue({
      doc: {
        id: "mock-1",
        title: "Offline Doc",
        filename: "offline.md",
        content: "offline",
        uploadedAt: new Date().toISOString(),
      },
      extracted: {
        entities: [
          { id: "e1", label: "Offline Doc", type: "Document", docIds: ["mock-1"], mentions: 1 },
        ],
        relationships: [],
      },
      usedMockFallback: true,
    });

    render(<UploadPage />);
    const file = new File(["offline"], "offline.md", { type: "text/markdown" });
    await user.upload(screen.getByTestId("upload-input"), file);

    await waitFor(() => {
      expect(screen.getByTestId("upload-mock-fallback")).toBeInTheDocument();
    });
  });
});
