import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Sidebar, { NAV_ITEMS } from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useCorpusStore } from "@/store/corpus";
import { seedDemoOrgs } from "@/lib/mockData";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/o/demo-acme-consulting/dashboard",
  useParams: () => ({ orgId: "demo-acme-consulting" }),
}));

describe("app shell", () => {
  const orgId = "demo-acme-consulting";

  beforeEach(() => {
    useCorpusStore.getState().resetForTests();
    useCorpusStore.getState().init();
    push.mockClear();
  });

  it("sidebar lists all nav items", () => {
    render(<Sidebar orgId={orgId} />);
    for (const item of NAV_ITEMS) {
      expect(screen.getByTestId(`nav-${item.segment}`)).toHaveTextContent(item.label);
    }
  });

  it("sidebar uses links without emoji", () => {
    render(<Sidebar orgId={orgId} />);
    const nav = screen.getByTestId("sidebar-nav");
    expect(nav.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });

  it("org switcher lists orgs from store", () => {
    render(<TopBar orgId={orgId} />);
    const select = screen.getByTestId("org-switcher") as HTMLSelectElement;
    const demoNames = seedDemoOrgs().map((o) => o.name);
    for (const name of demoNames) {
      expect(Array.from(select.options).some((o) => o.text === name)).toBe(true);
    }
  });

  it("home button links to landing page", () => {
    render(<TopBar orgId={orgId} />);
    const home = screen.getByTestId("home-btn");
    expect(home).toHaveAttribute("href", "/");
    expect(home).toHaveAccessibleName("Home");
  });

  it("switching org updates active org in store", async () => {
    const user = userEvent.setup();
    const targetId = useCorpusStore.getState().createOrg("Switcher Test Org");
    render(<TopBar orgId={orgId} />);
    await user.selectOptions(screen.getByTestId("org-switcher"), targetId);
    expect(useCorpusStore.getState().activeOrgId).toBe(targetId);
    expect(push).toHaveBeenCalledWith(`/o/${targetId}/dashboard`);
  });
});
