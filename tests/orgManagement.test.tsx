import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LandingPage from "@/app/page";
import TopBar from "@/components/TopBar";
import { useCorpusStore } from "@/store/corpus";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/o/custom-org/dashboard",
  useParams: () => ({ orgId: "custom-org" }),
}));

describe("organization management", () => {
  beforeEach(() => {
    useCorpusStore.getState().resetForTests();
    push.mockClear();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("creates org with user-provided name from landing dialog", async () => {
    const user = userEvent.setup();
    render(<LandingPage />);
    await user.click(screen.getByTestId("create-org-cta"));
    await user.type(screen.getByTestId("org-name-input"), "Pulse Creative");
    await user.click(screen.getByTestId("org-name-confirm"));

    await waitFor(() => {
      expect(push).toHaveBeenCalled();
    });

    const org = Object.values(useCorpusStore.getState().orgs).find(
      (o) => o.name === "Pulse Creative"
    );
    expect(org).toBeDefined();
    expect(org?.isDemo).toBe(false);
  });

  it("renames a non-demo org from the top bar", async () => {
    const user = userEvent.setup();
    const orgId = useCorpusStore.getState().createOrg("Before Rename");
    render(<TopBar orgId={orgId} />);

    await user.click(screen.getByTestId("rename-org-btn"));
    const input = screen.getByTestId("org-name-input");
    await user.clear(input);
    await user.type(input, "After Rename");
    await user.click(screen.getByTestId("org-name-confirm"));

    expect(useCorpusStore.getState().orgs[orgId].name).toBe("After Rename");
  });

  it("deletes a non-demo org and navigates away", async () => {
    const user = userEvent.setup();
    useCorpusStore.getState().init();
    const orgId = useCorpusStore.getState().createOrg("Delete Me");
    render(<TopBar orgId={orgId} />);

    await user.click(screen.getByTestId("delete-org-btn"));

    expect(useCorpusStore.getState().orgs[orgId]).toBeUndefined();
    expect(push).toHaveBeenCalled();
  });

  it("does not show rename/delete for demo orgs", () => {
    useCorpusStore.getState().init();
    const demoId = Object.values(useCorpusStore.getState().orgs).find((o) => o.isDemo)!.id;
    render(<TopBar orgId={demoId} />);
    expect(screen.queryByTestId("rename-org-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-org-btn")).not.toBeInTheDocument();
  });
});
