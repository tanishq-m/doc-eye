import type { InstructionFile } from "@/types";

export interface ParsedInstructions {
  sensitivePatterns: { pattern: RegExp; replacement: string }[];
  systemPromptAddition: string;
  excludedKeywords: string[];
  legalFooter?: string;
  appliedRules: string[];
}

export function parseInstructionFile(
  instructions?: InstructionFile
): ParsedInstructions {
  const empty: ParsedInstructions = {
    sensitivePatterns: [],
    systemPromptAddition: "",
    excludedKeywords: [],
    appliedRules: [],
  };
  if (!instructions?.content?.trim()) return empty;

  const content = instructions.content;
  const result: ParsedInstructions = { ...empty };

  // Extract Sensitive Data Masking section
  const maskMatch = content.match(
    /##\s+Sensitive Data(?:\s+Masking)?\n([\s\S]*?)(?=##|$)/i
  );
  if (maskMatch) {
    const lines = maskMatch[1].split("\n").filter((l) => l.trim().startsWith("-"));
    for (const line of lines) {
      // Pattern: "- Mask label: REGEX → REPLACEMENT"
      const maskParts = line.replace(/^-\s*Mask\s+\w+:\s*/i, "").split("→");
      const regexStr = maskParts[0]?.trim();
      const replacement = maskParts[1]?.trim() || "[REDACTED]";
      if (!regexStr) continue;
      try {
        result.sensitivePatterns.push({
          pattern: new RegExp(regexStr, "gi"),
          replacement,
        });
        result.appliedRules.push(`Masking pattern: ${regexStr} → ${replacement}`);
      } catch {
        // Skip invalid regex silently
      }
    }
  }

  // Extract Legal & Compliance section
  const legalMatch = content.match(
    /##\s+Legal(?:\s+&|\s+and)?\s+Compliance\n([\s\S]*?)(?=##|$)/i
  );
  if (legalMatch) {
    const section = legalMatch[1];
    const footerLine = section.match(/[-*]\s+(?:Always include\s+)?footer:\s*["']?(.+?)["']?\s*$/im);
    if (footerLine) {
      result.legalFooter = footerLine[1].trim();
      result.appliedRules.push(`Legal footer: ${result.legalFooter}`);
    }
    result.systemPromptAddition += `\n\nLEGAL COMPLIANCE RULES:\n${section.trim()}`;
  }

  // Extract Response Format section
  const formatMatch = content.match(
    /##\s+Response Format\n([\s\S]*?)(?=##|$)/i
  );
  if (formatMatch) {
    result.systemPromptAddition += `\n\nRESPONSE FORMAT RULES:\n${formatMatch[1].trim()}`;
    result.appliedRules.push("Response formatting rules applied");
  }

  // Extract Excluded Topics section
  const excludeMatch = content.match(
    /##\s+Excluded Topics?\n([\s\S]*?)(?=##|$)/i
  );
  if (excludeMatch) {
    const lines = excludeMatch[1].split("\n").filter((l) => l.trim().startsWith("-"));
    result.excludedKeywords = lines.map((l) =>
      l.replace(/^-\s*/, "").replace(/\s*\(.*\)/, "").trim()
    );
    if (result.excludedKeywords.length > 0) {
      result.systemPromptAddition += `\n\nEXCLUDED TOPICS (never mention): ${result.excludedKeywords.join(", ")}`;
      result.appliedRules.push(`Excluded topics: ${result.excludedKeywords.join(", ")}`);
    }
  }

  return result;
}

export function maskContent(
  content: string,
  patterns: ParsedInstructions["sensitivePatterns"]
): string {
  let masked = content;
  for (const { pattern, replacement } of patterns) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    masked = masked.replace(pattern, replacement);
  }
  return masked;
}
