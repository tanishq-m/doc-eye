"use client";

import { useState } from "react";

interface Instruction {
  id: string;
  name: string;
  category: string;
  description: string;
  content: string;
  enabled: boolean;
  priority: "high" | "medium" | "low";
}

export default function InstructionsPanel() {
  const [instructions, setInstructions] = useState<Instruction[]>([
    {
      id: "process-gen",
      name: "Process Generation Template",
      category: "Response Templates",
      description: "Defines how processes are structured and validated",
      content: `# Process Generation Guidelines

1. **Structure**: Always provide steps, inputs, outputs, dependencies, and validation checklist
2. **Sensitivity**: Mark sensitive operations with [SENSITIVE] flag
3. **Validation**: Include at least 3 validation checkpoints
4. **Rollback**: Include rollback procedures for critical steps
5. **Escalation**: Define escalation triggers and contacts`,
      enabled: true,
      priority: "high",
    },
    {
      id: "sensitive-filter",
      name: "Sensitive Data Filter",
      category: "Security",
      description: "Filters and masks sensitive information in responses",
      content: `# Sensitive Data Handling

- Never expose: API keys, passwords, credentials, tokens
- Mask: Email addresses, phone numbers, IP addresses
- Redact: Personal identifiable information (PII)
- Flag: Confidential business information with [CONFIDENTIAL]
- Replace: Actual values with placeholders (e.g., [API_KEY], [IP_ADDR])`,
      enabled: true,
      priority: "high",
    },
    {
      id: "runsheet-template",
      name: "Runsheet Generation Template",
      category: "Response Templates",
      description: "Template for emergency runsheets and playbooks",
      content: `# Runsheet Format

## Header
- Incident Type: [type]
- Severity: [critical/high/medium/low]
- Owner: [role]
- Duration: [estimated time]

## Pre-Flight Checklist
- [ ] Verify incident details
- [ ] Notify stakeholders
- [ ] Prepare rollback plan

## Execution Steps
[Numbered steps with decision trees]

## Post-Incident
- [ ] Verify resolution
- [ ] Update documentation
- [ ] Schedule RCA`,
      enabled: true,
      priority: "high",
    },
    {
      id: "source-citation",
      name: "Source Citation Standard",
      category: "Documentation",
      description: "Ensures all answers cite their source documents",
      content: `# Citation Requirements

- Every answer must cite at least one source document
- Format: [Document Name](document_id)
- Include confidence level: high/medium/low
- Cross-reference related documents
- Flag gaps where sources are insufficient`,
      enabled: true,
      priority: "medium",
    },
    {
      id: "compliance-check",
      name: "Compliance Validation",
      category: "Validation",
      description: "Validates responses against compliance frameworks",
      content: `# Compliance Checks

- GDPR: No personal data processing
- SOC2: Security best practices enforced
- ISO27001: Access controls documented
- Internal Policies: Company standards verified`,
      enabled: false,
      priority: "medium",
    },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const startEdit = (instruction: Instruction) => {
    setEditingId(instruction.id);
    setEditContent(instruction.content);
  };

  const saveEdit = (id: string) => {
    setInstructions((prev) =>
      prev.map((instr) =>
        instr.id === id ? { ...instr, content: editContent } : instr
      )
    );
    setEditingId(null);
  };

  const toggleEnabled = (id: string) => {
    setInstructions((prev) =>
      prev.map((instr) =>
        instr.id === id ? { ...instr, enabled: !instr.enabled } : instr
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-700 rounded-xl p-6">
        <p className="text-slate-300">
          Manage system instructions and templates that guide LLM responses. Define processes, security filters, and response formats.
        </p>
      </div>

      <div className="space-y-4">
        {instructions.map((instruction) => (
          <div
            key={instruction.id}
            className="border border-slate-700 rounded-lg bg-slate-800/30 overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white">{instruction.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      instruction.priority === "high"
                        ? "bg-red-500/20 text-red-300"
                        : instruction.priority === "medium"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-blue-500/20 text-blue-300"
                    }`}>
                      {instruction.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    <span className="font-medium text-slate-300">{instruction.category}</span>
                    {" — "}
                    {instruction.description}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleEnabled(instruction.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      instruction.enabled
                        ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                        : "bg-slate-600/50 text-slate-400 hover:bg-slate-600"
                    }`}
                  >
                    {instruction.enabled ? "✓ Enabled" : "Disabled"}
                  </button>
                </div>
              </div>

              {editingId === instruction.id ? (
                <div className="space-y-3 mt-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-40 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(instruction.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-600 text-slate-300 text-sm font-mono whitespace-pre-wrap break-words max-h-32 overflow-hidden">
                    {instruction.content}
                  </div>
                  <button
                    onClick={() => startEdit(instruction)}
                    className="mt-3 px-4 py-2 text-sm font-medium text-blue-300 hover:text-blue-200 transition-colors"
                  >
                    ✎ Edit Template
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border border-slate-700 rounded-lg p-6 bg-slate-800/30">
        <h3 className="font-semibold text-white mb-3">Add New Instruction</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Instruction name"
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Category"
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <textarea
          placeholder="Enter instruction content..."
          className="w-full mt-4 h-24 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
        />
        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          + Add Instruction
        </button>
      </div>
    </div>
  );
}
