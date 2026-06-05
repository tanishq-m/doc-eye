#!/usr/bin/env node
/**
 * Regenerates binary marketing-agency fixtures (DOCX + PDF).
 * Text/Markdown sources are committed directly; run: node scripts/generate-marketing-fixtures.mjs
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "fixtures", "marketing-agency");
const source = path.join(root, "source");

function writeMinimalPdf(outPath, lines) {
  const safe = (s) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const textOps = lines
    .map((line, i) => `72 ${720 - i * 16} Td (${safe(line)}) Tj`)
    .join("\n");
  const stream = `BT\n/F1 11 Tf\n${textOps}\nET`;
  const streamLength = Buffer.byteLength(stream, "utf8");

  const objects = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
  );
  objects.push(
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj\n`
  );
  objects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF\n`;

  fs.writeFileSync(outPath, pdf);
}

function tryDocx(srcName, outName) {
  const src = path.join(source, srcName);
  const out = path.join(root, outName);
  if (process.platform === "darwin") {
    execSync(`textutil -convert docx "${src}" -output "${out}"`, { stdio: "inherit" });
    return;
  }
  if (!fs.existsSync(out)) {
    console.warn(`Skip DOCX ${outName}: textutil unavailable (macOS only). Commit binary or run on macOS.`);
  }
}

tryDocx("influencer-partnership-policy.txt", "influencer-partnership-policy.docx");
tryDocx("q1-campaign-performance-report.txt", "q1-campaign-performance-report.docx");

writeMinimalPdf(path.join(root, "agency-master-service-agreement.pdf"), [
  "AGENCY MASTER SERVICE AGREEMENT - SUMMARY",
  "Pulse Creative Agency and Client",
  "Services: strategy, creative, media buying, analytics.",
  "Term: 12 months. Fees per SOW. Payment Net 30.",
  "Related: Client Onboarding Playbook, Media Buying Standards.",
]);

// Generate manifest
const manifest = {
  orgName: "Pulse Creative Agency",
  description: "A modern digital marketing agency with diverse service offerings",
  documents: [
    { filename: "agency-master-service-agreement.pdf", title: "Master Service Agreement", format: "pdf", category: "contracts" },
    { filename: "brand-voice-guidelines.md", title: "Brand Voice Guidelines", format: "markdown", category: "standards" },
    { filename: "media-buying-standards.md", title: "Media Buying Standards", format: "markdown", category: "standards" },
    { filename: "campaign-performance-dashboard-guide.md", title: "Campaign Performance Dashboard Guide", format: "markdown", category: "guides" },
    { filename: "client-onboarding-playbook.md", title: "Client Onboarding Playbook", format: "markdown", category: "procedures" },
    { filename: "influencer-partnership-policy.docx", title: "Influencer Partnership Policy", format: "docx", category: "policies" },
    { filename: "q1-campaign-performance-report.docx", title: "Q1 Campaign Performance Report", format: "docx", category: "reports" },
    { filename: "social-media-strategy.txt", title: "Social Media Strategy", format: "text", category: "strategies" },
    { filename: "creative-brief-template.txt", title: "Creative Brief Template", format: "text", category: "templates" },
    { filename: "analytics-reporting-standards.txt", title: "Analytics Reporting Standards", format: "text", category: "standards" },
  ],
};

fs.writeFileSync(path.join(root, "manifest.json"), JSON.stringify(manifest, null, 2));

console.log("Marketing fixtures generated in fixtures/marketing-agency/");
