"use client";

import { useState } from "react";

interface DocSection {
  id: string;
  title: string;
  icon: string;
  content: string;
  topics?: string[];
}

export default function DocumentationPanel() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const docs: DocSection[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: "🚀",
      content: `# Getting Started with DOC-EYE

## Step 1: Upload Documents
Navigate to the **Uploads** section and drag & drop your documents (PDF, DOCX, Markdown, or TXT files). Documents are automatically extracted, processed, and indexed.

## Step 2: Ask Questions
Go to **Query** to ask natural language questions about your uploaded documents. DOC-EYE will search your knowledge base and provide grounded answers with source citations.

## Step 3: Generate Processes
Use the process generation feature to automatically create structured runbooks, procedures, and workflows based on your documentation.

## Step 4: Detect Gaps
The **Uploads** section includes gap detection to identify missing documents referenced in your knowledge base. Accept generated drafts to auto-fill gaps.

## Step 5: Integrate Systems
Connect third-party tools via **Integrations** to sync documents, send alerts, and automate knowledge workflows.`,
      topics: ["Uploads", "Queries", "Processes", "Gap Detection"],
    },
    {
      id: "document-formats",
      title: "Supported Document Formats",
      icon: "📄",
      content: `# Supported File Formats

## PDF
- Multi-page document extraction
- Table recognition
- Image text extraction (OCR)
- Usage: Process documents, policies, manuals

## DOCX (Microsoft Word)
- Full formatting preservation
- Table and list support
- Comments and tracked changes
- Usage: Process reports, specifications, guides

## Markdown (.md)
- Native support with full syntax
- Code block preservation
- Nested structure recognition
- Usage: Documentation, runbooks, instructions

## Plain Text (.txt)
- Simple text processing
- UTF-8 encoding support
- Newline-aware parsing
- Usage: Logs, notes, plain documentation

## Recommended Best Practices
- Keep file sizes under 50MB
- Use clear headings and structure
- Include relevant metadata
- Avoid scanned images without OCR`,
      topics: ["PDF", "DOCX", "Markdown", "Text"],
    },
    {
      id: "query-tips",
      title: "Query Best Practices",
      icon: "💡",
      content: `# Getting Better Answers

## Effective Queries
✓ "What are the steps to migrate from PPTP VPN to ZTNA?"
✓ "What information do we need for a device provisioning request?"
✓ "List all security policies related to remote access"

## Avoid Vague Queries
✗ "Tell me about VPN"
✗ "What is this?"
✗ "How do we do things?"

## Use Specific Keywords
- Include exact document/procedure names
- Mention specific systems or tools
- Reference timeframes if relevant (e.g., "Q3 2024 changes")

## Confidence Levels
- **High**: Answer directly cited from documents
- **Medium**: Answer inferred from multiple sources
- **Low**: Limited source coverage, verify independently

## Source Citations
All answers cite source documents. Click source badges to review the original document section.`,
      topics: ["Query", "Keywords", "Sources"],
    },
    {
      id: "process-generation",
      title: "Process Generation Guide",
      icon: "⚙️",
      content: `# Generating Structured Processes

## Process Components

### Steps
Numbered, sequential actions with clear instructions and decision points.

### Inputs
Data, files, or information required before starting the process.

### Outputs
Deliverables, results, or artifacts generated after completion.

### Dependencies
Prerequisites, other processes, or approvals needed.

### Validation Checklist
Post-execution verification to confirm success.

## Example: VPN Migration Process
- **Steps**: 7-9 detailed migration steps
- **Inputs**: Device serial, current VPN config
- **Outputs**: Confirmation email, updated device record
- **Dependencies**: MFA enrollment, manager approval
- **Validation**: Connectivity test, traffic analysis

## Tips
- Processes are automatically generated from your documentation
- Edit processes directly before execution
- Use for runbooks, onboarding, and emergency procedures
- Share processes with teams via integrations`,
      topics: ["Process", "Structure", "Execution"],
    },
    {
      id: "gap-detection",
      title: "Knowledge Gap Detection",
      icon: "🔍",
      content: `# Identifying Missing Documentation

## How Gap Detection Works

1. **Reference Extraction**: Scans documents for mentions of other documents
2. **Cross-Reference**: Checks if referenced documents exist in the knowledge base
3. **Gap Identification**: Lists missing documents and their business impact
4. **Draft Generation**: Automatically generates initial Markdown for missing docs

## Gap Acceptance Workflow

1. Review detected gaps
2. View auto-generated drafts (preview expandable)
3. Click "Accept Draft" to create and index the document
4. Gap is automatically resolved in next detection run

## Business Impact
Each gap includes impact analysis:
- Which documents reference it
- Workflow incompleteness details
- Recommended priority for creation

## Examples
- Missing: "IT Asset Inventory" (referenced by VPN Migration Policy)
- Missing: "Remote Access Standards" (required for compliance)
- Missing: "MFA Enrollment Procedure" (blocking onboarding)`,
      topics: ["Gaps", "References", "Documentation"],
    },
    {
      id: "integrations-guide",
      title: "Integrations Setup",
      icon: "🔗",
      content: `# Connecting Third-Party Services

## Available Integrations

### Slack
- Send process updates to channels
- Post answers to questions
- Receive gap notifications

### Jira
- Create tickets from generated processes
- Track process execution
- Link documentation to issues

### SharePoint
- Sync document libraries
- Automatically index new uploads
- Maintain version control

### Microsoft Teams
- Collaborative knowledge access
- Channel-based document sharing
- Threaded Q&A discussions

### Salesforce
- Access knowledge articles
- Sync documentation
- Track customer-facing processes

### Confluence
- Sync wiki pages
- Maintain single source of truth
- Cross-link documentation

## Setup Steps
1. Navigate to **Integrations**
2. Click "Connect" on desired service
3. Provide API key or OAuth credentials
4. Test connection
5. Configure permissions and sync settings

## Security
- All credentials encrypted at rest
- Never exposed in logs or exports
- Regularly rotate API keys
- Use service accounts for integrations`,
      topics: ["Slack", "Jira", "SharePoint", "Teams"],
    },
    {
      id: "keyboard-shortcuts",
      title: "Keyboard Shortcuts",
      icon: "⌨️",
      content: `# Quick Navigation

## Navigation
- **Q**: Jump to Query
- **U**: Jump to Uploads
- **I**: Jump to Integrations
- **T**: Jump to Instructions
- **D**: Jump to Documentation

## General
- **Cmd/Ctrl + K**: Command palette
- **Cmd/Ctrl + /**: Help menu
- **Esc**: Close modals
- **Enter**: Submit forms

## Query Panel
- **Cmd/Ctrl + Enter**: Submit query
- **Shift + Enter**: New line in query
- **Arrow Up**: Previous query

## Uploads
- **Cmd/Ctrl + V**: Paste document
- **Drag & Drop**: Add files

## Tips
- Shortcuts work from any section
- Some shortcuts require focus on element
- Customize shortcuts in Settings`,
      topics: ["Shortcuts", "Navigation", "Speed"],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-700 rounded-xl p-6">
        <p className="text-slate-300">
          Learn how to use DOC-EYE effectively. Find guides, best practices, and tips for every feature.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search documentation..."
          className="w-full px-4 py-3 pl-10 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>
      </div>

      {/* Documentation Sections */}
      <div className="space-y-3">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="border border-slate-700 rounded-lg bg-slate-800/30 overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedId(expandedId === doc.id ? null : doc.id)
              }
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{doc.icon}</span>
                <div>
                  <h3 className="font-semibold text-white">{doc.title}</h3>
                  {doc.topics && (
                    <p className="text-xs text-slate-400 mt-1">
                      {doc.topics.join(" • ")}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={`text-xl transition-transform ${
                  expandedId === doc.id ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {expandedId === doc.id && (
              <div className="px-6 py-6 border-t border-slate-700 bg-slate-900/30">
                <div className="prose prose-invert max-w-none text-slate-300 text-sm">
                  <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {doc.content}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Support Card */}
      <div className="border border-blue-500/30 bg-blue-500/10 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <span className="text-2xl">💬</span>
          <div>
            <h3 className="font-semibold text-blue-300 mb-2">Need Help?</h3>
            <p className="text-sm text-blue-200 mb-4">
              Can&apos;t find what you&apos;re looking for? Our support team is ready to assist.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
