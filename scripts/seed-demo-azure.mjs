#!/usr/bin/env node
/**
 * Index the Acme demo corpus into Azure AI Search.
 * Usage: npm run seed:demo-azure
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const envPath = resolve(process.cwd(), ".env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const script = `
import { seedDemoOrgToAzure } from './src/lib/seedDemoAzure.ts';
seedDemoOrgToAzure()
  .then((r) => { console.log(JSON.stringify(r)); })
  .catch((e) => { console.error(e); process.exit(1); });
`;

const result = spawnSync("npx", ["--yes", "tsx", "-e", script], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
