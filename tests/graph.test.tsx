import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import { seedDemoOrgs } from "@/lib/mockData";

vi.mock("react-force-graph-2d", () => ({
  default: ({
    graphData,
    onNodeClick,
  }: {
    graphData: { nodes: { id: string; label: string }[] };
    onNodeClick?: (n: { id: string; label: string }) => void;
  }) => (
    <div data-testid="force-graph">
      {graphData.nodes.map((n) => (
        <button key={n.id} type="button" onClick={() => onNodeClick?.(n)}>
          {n.label}
        </button>
      ))}
    </div>
  ),
}));

describe("KnowledgeGraph", () => {
  const org = seedDemoOrgs().find((o) => o.id === "demo-acme-consulting")!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mounts with seeded org data", () => {
    render(<KnowledgeGraph org={org} />);
    expect(screen.getByTestId("knowledge-graph")).toBeInTheDocument();
    expect(screen.getByTestId("force-graph")).toBeInTheDocument();
    expect(screen.getByTestId("graph-node-count")).toHaveTextContent(/nodes/);
  });

  it("filter toggles reduce visible node count", async () => {
    const user = userEvent.setup();
    render(<KnowledgeGraph org={org} />);
    const countEl = screen.getByTestId("graph-node-count");
    const initialText = countEl.textContent ?? "";

    await user.click(screen.getByTestId("filter-Client"));
    await user.click(screen.getByTestId("filter-Project"));
    await user.click(screen.getByTestId("filter-Team"));
    await user.click(screen.getByTestId("filter-Process"));
    await user.click(screen.getByTestId("filter-Risk"));
    await user.click(screen.getByTestId("filter-Dependency"));
    await user.click(screen.getByTestId("filter-Document"));
    await user.click(screen.getByTestId("filter-Gap"));

    expect(countEl.textContent).not.toBe(initialText);
    expect(countEl).toHaveTextContent(/0 nodes/);
  });

  it("search filters nodes by label", async () => {
    const user = userEvent.setup();
    render(<KnowledgeGraph org={org} />);
    const search = screen.getByTestId("graph-search");
    await user.type(search, "Meridian Bank");
    expect(screen.getByTestId("graph-node-count").textContent).toMatch(/1 nodes/);
    expect(screen.getByText("Meridian Bank")).toBeInTheDocument();
  });

  it("opens node drawer on click", async () => {
    const user = userEvent.setup();
    render(<KnowledgeGraph org={org} />);
    await user.click(screen.getByText("Meridian Bank"));
    expect(screen.getByTestId("node-drawer")).toBeInTheDocument();
    expect(screen.getByTestId("node-drawer")).toHaveTextContent("Meridian Bank");
    expect(screen.getByTestId("node-summary")).toBeInTheDocument();
  });

  it("renders legend and insight bar", () => {
    render(<KnowledgeGraph org={org} />);
    expect(screen.getByTestId("graph-legend")).toBeInTheDocument();
    expect(screen.getByTestId("graph-insights")).toBeInTheDocument();
    expect(screen.getByTestId("graph-most-connected")).toBeInTheDocument();
    expect(screen.getByTestId("legend-Client")).toBeInTheDocument();
  });
});
