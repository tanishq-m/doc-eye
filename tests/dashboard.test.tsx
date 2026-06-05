import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/o/[orgId]/dashboard/page";
import { useCorpusStore } from "@/store/corpus";
import { graphStats } from "@/lib/readiness";
import { seedDemoOrgs } from "@/lib/mockData";

vi.mock("next/navigation", () => ({
  useParams: () => ({ orgId: "demo-acme-consulting" }),
}));

describe("dashboard", () => {
  const org = seedDemoOrgs().find((o) => o.id === "demo-acme-consulting")!;
  const stats = graphStats(org);

  beforeEach(() => {
    useCorpusStore.getState().resetForTests();
    useCorpusStore.getState().init();
  });

  it("renders overall score from org", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("overall-score")).toHaveTextContent(String(org.score.overall));
  });

  it("renders four stat card values", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("stat-entities-value")).toHaveTextContent(String(stats.entityCount));
    expect(screen.getByTestId("stat-relationships-value")).toHaveTextContent(String(stats.edgeCount));
    expect(screen.getByTestId("stat-documents-value")).toHaveTextContent(String(stats.docCount));
    expect(screen.getByTestId("stat-gaps-value")).toHaveTextContent(String(stats.gapCount));
  });

  it("renders radar with five axes", () => {
    render(<DashboardPage />);
    const axes = screen.getByTestId("radar-axes");
    expect(axes.querySelectorAll("li")).toHaveLength(5);
  });

  it("renders timeline with org history points", () => {
    render(<DashboardPage />);
    const points = screen.getByTestId("timeline-points");
    expect(points.querySelectorAll("li")).toHaveLength(org.history.length);
  });
});
