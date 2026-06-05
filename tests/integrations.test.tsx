import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IntegrationsPage from "@/app/o/[orgId]/integrations/page";
import { useCorpusStore } from "@/store/corpus";

const navState = { orgId: "" };

vi.mock("next/navigation", () => ({
  useParams: () => ({ orgId: navState.orgId }),
}));

describe("integrations page", () => {
  beforeEach(() => {
    useCorpusStore.getState().resetForTests();
    navState.orgId = useCorpusStore.getState().createOrg("Integrations Org");
  });

  it("renders source and AI connector sections with connect CTAs", () => {
    render(<IntegrationsPage />);
    expect(screen.getByTestId("source-connectors")).toBeInTheDocument();
    expect(screen.getByTestId("ai-connectors")).toBeInTheDocument();
    expect(screen.getByTestId("connect-jira")).toBeInTheDocument();
    expect(screen.getByTestId("connect-mistral")).toBeInTheDocument();
  });

  it("ingesting mock Jira items grows only the active org graph", async () => {
    const user = userEvent.setup();
    const orgId = navState.orgId;
    const otherId = useCorpusStore.getState().createOrg("Other Org");
    const before = useCorpusStore.getState().orgs[orgId].entities.length;
    const otherBefore = useCorpusStore.getState().orgs[otherId].entities.length;

    render(<IntegrationsPage />);
    await user.click(screen.getByTestId("connect-jira"));
    expect(screen.getByTestId("connector-picker-modal")).toBeInTheDocument();

    await user.click(screen.getByTestId("picker-item-jira-101"));
    await user.click(screen.getByTestId("ingest-selected"));

    await waitFor(() => {
      expect(screen.getByTestId("ingest-success")).toBeInTheDocument();
    });

    expect(useCorpusStore.getState().orgs[orgId].entities.length).toBeGreaterThan(before);
    expect(useCorpusStore.getState().orgs[otherId].entities.length).toBe(otherBefore);
  });

  it("selecting AI provider updates org active provider", async () => {
    const user = userEvent.setup();
    const orgId = navState.orgId;

    render(<IntegrationsPage />);
    await user.click(screen.getByTestId("connect-openai"));

    expect(useCorpusStore.getState().orgs[orgId].aiProvider).toBe("openai");
  });
});
