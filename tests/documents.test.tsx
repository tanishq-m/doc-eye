import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DocumentsPage from "@/app/o/[orgId]/documents/page";
import { useCorpusStore } from "@/store/corpus";

const navState = { orgId: "" };

vi.mock("next/navigation", () => ({
  useParams: () => ({ orgId: navState.orgId }),
}));

describe("documents page", () => {
  beforeEach(() => {
    useCorpusStore.getState().resetForTests();
    const orgId = useCorpusStore.getState().createOrg("Docs Org");
    navState.orgId = orgId;

    useCorpusStore.getState().addDocument(
      orgId,
      {
        id: "doc-1",
        title: "Brand Guide",
        filename: "brand.md",
        content: "Brand voice and tone.",
        uploadedAt: new Date().toISOString(),
      },
      {
        entities: [
          { id: "e1", label: "Brand Voice", type: "Process", docIds: ["doc-1"], mentions: 5 },
          { id: "e2", label: "Acme Client", type: "Client", docIds: ["doc-1"], mentions: 3 },
        ],
        relationships: [{ id: "r1", source: "e1", target: "e2", label: "serves" }],
      }
    );
  });

  it("lists org documents with entity chips and mention counts", () => {
    render(<DocumentsPage />);
    expect(screen.getByTestId("documents-list")).toBeInTheDocument();
    expect(screen.getByTestId("document-row-doc-1")).toBeInTheDocument();
    expect(screen.getByTestId("doc-entities-doc-1")).toHaveTextContent("Brand Voice");
    expect(screen.getByTestId("doc-entities-doc-1")).toHaveTextContent("Acme Client");
    expect(screen.getByTestId("doc-mentions-doc-1")).toHaveTextContent("8 mentions");
    expect(screen.getByTestId("doc-quality-doc-1")).toHaveTextContent(/quality/i);
  });

  it("shows empty state for orgs with no docs", () => {
    const emptyId = useCorpusStore.getState().createOrg("Empty Docs");
    navState.orgId = emptyId;
    render(<DocumentsPage />);
    expect(screen.getByTestId("documents-empty-state")).toBeInTheDocument();
  });
});
