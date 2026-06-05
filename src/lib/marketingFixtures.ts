import fs from "node:fs";
import path from "node:path";

export const MARKETING_FIXTURES_DIR = path.join(
  process.cwd(),
  "fixtures",
  "marketing-agency"
);

export { ALLOWED_UPLOAD_EXTENSIONS, isAllowedUploadExtension } from "@/lib/uploadFormats";

export interface MarketingFixture {
  filename: string;
  title: string;
  format: "markdown" | "text" | "docx" | "pdf";
  category: string;
}

export interface MarketingFixtureManifest {
  orgName: string;
  description: string;
  documents: MarketingFixture[];
}

export function loadMarketingFixtureManifest(): MarketingFixtureManifest {
  const manifestPath = path.join(MARKETING_FIXTURES_DIR, "manifest.json");
  const raw = fs.readFileSync(manifestPath, "utf-8");
  return JSON.parse(raw) as MarketingFixtureManifest;
}

export function marketingFixturePath(filename: string): string {
  return path.join(MARKETING_FIXTURES_DIR, filename);
}

export function readMarketingFixture(filename: string): Buffer {
  return fs.readFileSync(marketingFixturePath(filename));
}

