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

describe("Phase 7.7 — graph wow", () => {
  const org = seedDemoOrgs().find((o) => o.id === "demo-acme-consulting")!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders graph-canvas wrapper and graph-replay control", () => {
    render(<KnowledgeGraph org={org} />);
    expect(screen.getByTestId("graph-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("graph-replay")).toBeInTheDocument();
  });

  it("clicking graph-replay does not crash and node count remains", async () => {
    const user = userEvent.setup();
    render(<KnowledgeGraph org={org} />);
    const countBefore = screen.getByTestId("graph-node-count").textContent;

    await user.click(screen.getByTestId("graph-replay"));

    expect(screen.getByTestId("graph-node-count")).toBeInTheDocument();
    expect(screen.getByTestId("graph-node-count").textContent).toBe(countBefore);
    expect(screen.getByTestId("force-graph")).toBeInTheDocument();
  });
});
