import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Cumulative test inventory — append-only by phase/step.
 * If you remove a file from this list, you are breaking the regression stack.
 * Add new entries when a step introduces new tests.
 */
export const TEST_INVENTORY: { phase: string; step: string; file: string }[] = [
  { phase: "0", step: "0.1", file: "tests/smoke.test.ts" },
  { phase: "0", step: "0.3", file: "tests/types.test.ts" },
  { phase: "0", step: "0.4", file: "tests/readiness.test.ts" },
  { phase: "1", step: "1.1", file: "tests/mockData.test.ts" },
  { phase: "1", step: "1.2", file: "tests/store.test.ts" },
  { phase: "2", step: "2.1", file: "tests/landing.test.tsx" },
  { phase: "2", step: "2.2", file: "tests/shell.test.tsx" },
  { phase: "2", step: "2.3", file: "tests/dashboard.test.tsx" },
  { phase: "3", step: "3.1", file: "tests/graphAdapter.test.ts" },
  { phase: "3", step: "3.2", file: "tests/graph.test.tsx" },
  { phase: "3", step: "3.3", file: "tests/graphView.test.ts" },
  { phase: "4", step: "4.1", file: "tests/gaps.test.ts" },
  { phase: "4", step: "4.2", file: "tests/gapsUi.test.tsx" },
  { phase: "4", step: "4.3", file: "tests/gapResolve.test.tsx" },
  { phase: "5", step: "5.1", file: "tests/entityExtractor.test.ts" },
  { phase: "5", step: "5.2", file: "tests/search.test.ts" },
  { phase: "5", step: "5.3", file: "tests/upload.test.tsx" },
  { phase: "5", step: "5.3", file: "tests/marketingFixtures.test.ts" },
  { phase: "5", step: "5.4", file: "tests/connectors.test.ts" },
  { phase: "5", step: "5.4", file: "tests/integrations.test.tsx" },
  { phase: "5", step: "5.5", file: "tests/orgManagement.test.tsx" },
  { phase: "6", step: "6.1", file: "tests/ask.test.tsx" },
  { phase: "6", step: "6.1", file: "tests/askClient.test.ts" },
  { phase: "6", step: "6.2", file: "tests/documents.test.tsx" },
  { phase: "6", step: "6.2", file: "tests/documentIntel.test.ts" },
  { phase: "6", step: "6.3", file: "tests/nav.test.tsx" },
  { phase: "6", step: "6.4", file: "tests/orgExport.test.ts" },
  { phase: "6", step: "6.4", file: "tests/export.test.tsx" },
  { phase: "6", step: "6.4", file: "tests/orgConnectorApi.test.ts" },
  { phase: "7", step: "7.1", file: "tests/wording.test.tsx" },
  { phase: "7", step: "7.4", file: "tests/demoFlow.test.tsx" },
  { phase: "7", step: "7.7", file: "tests/graphWow.test.tsx" },
  { phase: "appendix", step: "demo-corpus", file: "tests/seedDemoAzure.test.ts" },
  { phase: "meta", step: "all", file: "tests/inventory.test.ts" },
];

describe("cumulative test inventory", () => {
  it.each(TEST_INVENTORY)("$file exists (phase $phase step $step)", ({ file }) => {
    expect(fs.existsSync(path.join(process.cwd(), file))).toBe(true);
  });

  it("has no duplicate test files", () => {
    const files = TEST_INVENTORY.map((t) => t.file);
    expect(new Set(files).size).toBe(files.length);
  });
});
