import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LandingPage from "@/app/page";
import { useCorpusStore } from "@/store/corpus";
import { getDemoOrgIds } from "@/lib/mockData";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
}));

describe("landing page", () => {
  beforeEach(() => {
    useCorpusStore.getState().resetForTests();
    push.mockClear();
  });

  it("renders hero copy", () => {
    render(<LandingPage />);
    expect(screen.getByTestId("landing-hero")).toHaveTextContent(/take it anywhere/i);
  });

  it("renders portability subhead with agent names", () => {
    render(<LandingPage />);
    const subhead = screen.getByTestId("landing-subhead");
    expect(subhead).toBeInTheDocument();
    expect(subhead.textContent).toMatch(/Claude/i);
    expect(subhead.textContent).toMatch(/ChatGPT/i);
  });

  it("renders three value cards", () => {
    render(<LandingPage />);
    const values = screen.getByTestId("landing-values");
    expect(values.querySelectorAll("h2")).toHaveLength(3);
  });

  it("shows Try Demo Org CTA", () => {
    render(<LandingPage />);
    expect(screen.getByTestId("try-demo-cta")).toBeInTheDocument();
  });

  it("shows Create Organization CTA", () => {
    render(<LandingPage />);
    expect(screen.getByTestId("create-org-cta")).toBeInTheDocument();
  });

  it("navigates to demo org dashboard on Try Demo", async () => {
    const user = userEvent.setup();
    render(<LandingPage />);
    await user.click(screen.getByTestId("try-demo-cta"));
    expect(push).toHaveBeenCalledWith(`/o/${getDemoOrgIds()[0]}/dashboard`);
  });

  it("creates org and navigates on Create Organization", async () => {
    const user = userEvent.setup();
    render(<LandingPage />);
    await user.click(screen.getByTestId("create-org-cta"));
    await user.type(screen.getByTestId("org-name-input"), "My Workspace");
    await user.click(screen.getByTestId("org-name-confirm"));
    expect(push).toHaveBeenCalled();
    const url = push.mock.calls[0][0] as string;
    expect(url).toMatch(/^\/o\/.+\/dashboard$/);
    const created = Object.values(useCorpusStore.getState().orgs).find(
      (o) => o.name === "My Workspace"
    );
    expect(created).toBeDefined();
  });
});
