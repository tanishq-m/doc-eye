import { describe, it, expect } from "vitest";
import { NAV_ITEMS } from "@/components/Sidebar";

const PRIMARY_SEGMENTS = NAV_ITEMS.map((item) => item.segment);

describe("primary navigation", () => {
  it("includes all core org routes", () => {
    expect(PRIMARY_SEGMENTS).toEqual(
      expect.arrayContaining([
        "dashboard",
        "graph",
        "gaps",
        "documents",
        "ask",
        "upload",
        "instructions",
        "integrations",
        "export",
      ])
    );
  });

  it("does not include legacy documentation or settings tabs", () => {
    expect(PRIMARY_SEGMENTS).not.toContain("documentation");
    expect(PRIMARY_SEGMENTS).not.toContain("settings");
  });
});
