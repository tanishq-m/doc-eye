"use client";

import { useState } from "react";

interface Integration {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  status: "connected" | "disconnected";
  apiKey?: string;
}

export default function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "slack",
      name: "Slack",
      category: "Communication",
      icon: "💬",
      description: "Send knowledge queries and process updates to Slack channels",
      status: "disconnected",
    },
    {
      id: "jira",
      name: "Jira",
      category: "Project Management",
      icon: "🔴",
      description: "Create Jira tickets from generated processes and gap analyses",
      status: "disconnected",
    },
    {
      id: "sharepoint",
      name: "SharePoint",
      category: "Document Storage",
      icon: "📁",
      description: "Sync documents from SharePoint into DOC-EYE knowledge base",
      status: "disconnected",
    },
    {
      id: "teams",
      name: "Microsoft Teams",
      category: "Communication",
      icon: "👥",
      description: "Integrate with Teams for collaborative knowledge access",
      status: "disconnected",
    },
    {
      id: "salesforce",
      name: "Salesforce",
      category: "CRM",
      icon: "☁️",
      description: "Access Salesforce knowledge articles and sync documentation",
      status: "disconnected",
    },
    {
      id: "confluence",
      name: "Confluence",
      category: "Wiki & Documentation",
      icon: "📖",
      description: "Sync Confluence pages to your knowledge base",
      status: "disconnected",
    },
  ]);

  const [showConfigModal, setShowConfigModal] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");

  const maskKey = (key: string) =>
    key.length <= 4 ? "••••" : `${"..".padStart(8, "•")}${key.slice(-4)}`;

  const toggleIntegration = (id: string) => {
    setShowConfigModal(id);
  };

  const saveIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === id
          ? { ...int, status: "connected", apiKey: apiKeyInput }
          : int
      )
    );
    setShowConfigModal(null);
    setApiKeyInput("");
  };

  const disconnectIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === id
          ? { ...int, status: "disconnected", apiKey: undefined }
          : int
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-700 rounded-xl p-6">
        <p className="text-slate-300">
          Connect third-party platforms and APIs to extend DOC-EYE&apos;s capabilities. Sync documents, send insights to teams, and automate workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="border border-slate-700 rounded-lg p-5 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{integration.icon}</span>
                <div>
                  <h3 className="font-semibold text-white">{integration.name}</h3>
                  <p className="text-xs text-slate-400">{integration.category}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                integration.status === "connected"
                  ? "bg-green-500/20 text-green-300"
                  : "bg-slate-600/50 text-slate-400"
              }`}>
                {integration.status === "connected" ? "✓ Connected" : "Not Connected"}
              </div>
            </div>

            <p className="text-sm text-slate-400 mb-3">{integration.description}</p>

            {integration.status === "connected" && integration.apiKey && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg">
                <span className="text-xs text-slate-400">API Key:</span>
                <code className="text-xs text-green-300 font-mono tracking-widest">{maskKey(integration.apiKey)}</code>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => toggleIntegration(integration.id)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  integration.status === "connected"
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {integration.status === "connected" ? "Reconfigure" : "Connect"}
              </button>
              {integration.status === "connected" && (
                <button
                  onClick={() => disconnectIntegration(integration.id)}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-red-600/20 text-red-300 hover:bg-red-600/30 transition-colors"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Configure {integrations.find((i) => i.id === showConfigModal)?.name}
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  API Key / Token
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={
                    integrations.find((i) => i.id === showConfigModal)?.apiKey
                      ? maskKey(integrations.find((i) => i.id === showConfigModal)!.apiKey!)
                      : "Enter your API key"
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-slate-400">
                Your API key is encrypted and stored securely. Never shared with third parties.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfigModal(null)}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => saveIntegration(showConfigModal)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
