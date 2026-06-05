"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Check, Plug, X } from "lucide-react";
import {
  AI_CONNECTORS,
  MOCK_CONNECTOR_ITEMS,
  SOURCE_CONNECTORS,
  type ConnectorDefinition,
  type ConnectorItem,
} from "@/lib/connectors";
import { ingestConnectorItems } from "@/lib/connectorIngest";
import { useCorpusStore } from "@/store/corpus";

function ConnectorCard({
  connector,
  active,
  onConnect,
  onSelectProvider,
}: {
  connector: ConnectorDefinition;
  active?: boolean;
  onConnect?: () => void;
  onSelectProvider?: () => void;
}) {
  const isAi = connector.category === "ai";
  const disabled = connector.status === "coming-soon";

  return (
    <article
      className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3"
      data-testid={`connector-${connector.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center text-sm font-bold">
            {connector.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{connector.name}</h3>
            <p className="text-xs text-muted-foreground">{connector.blurb}</p>
          </div>
        </div>
        {active && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
            <Check className="h-3.5 w-3.5" aria-hidden />
            Active
          </span>
        )}
      </div>
      <button
        type="button"
        disabled={disabled}
        data-testid={`connect-${connector.id}`}
        onClick={isAi ? onSelectProvider : onConnect}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plug className="h-4 w-4" aria-hidden />
        {disabled ? "Coming soon" : isAi ? "Use provider" : "Connect"}
      </button>
    </article>
  );
}

export default function IntegrationsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const org = useCorpusStore((s) => s.orgs[orgId]);
  const addDocument = useCorpusStore((s) => s.addDocument);
  const setAiProvider = useCorpusStore((s) => s.setAiProvider);

  const [pickerConnector, setPickerConnector] = useState<ConnectorDefinition | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [ingestMessage, setIngestMessage] = useState<string | null>(null);

  if (!org) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Organization not found.
      </div>
    );
  }

  const items = pickerConnector ? MOCK_CONNECTOR_ITEMS[pickerConnector.id] ?? [] : [];

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const ingestSelected = () => {
    if (!pickerConnector) return;
    const toIngest = items.filter((item) => selectedItems.has(item.id));
    const ingested = ingestConnectorItems(orgId, pickerConnector.id, toIngest);
    for (const row of ingested) {
      addDocument(orgId, row.doc, row.extracted);
    }
    setIngestMessage(
      `Ingested ${ingested.length} item${ingested.length === 1 ? "" : "s"} from ${pickerConnector.name} into ${org.name}.`
    );
    setPickerConnector(null);
    setSelectedItems(new Set());
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8" data-testid="integrations-page">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Integrations
        </p>
        <p className="text-sm text-muted-foreground">
          Connect data sources to ingest content into this org&apos;s storage and graph. Connect the
          tools your team already uses, then choose the AI provider that powers extraction and
          answers.
        </p>
      </div>

      {ingestMessage && (
        <p className="text-sm text-emerald-400" data-testid="ingest-success">
          {ingestMessage}
        </p>
      )}

      <section data-testid="source-connectors">
        <h2 className="text-sm font-semibold text-foreground mb-3">Data sources</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SOURCE_CONNECTORS.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              onConnect={() => {
                setPickerConnector(connector);
                setSelectedItems(new Set());
                setIngestMessage(null);
              }}
            />
          ))}
        </div>
      </section>

      <section data-testid="ai-connectors">
        <h2 className="text-sm font-semibold text-foreground mb-3">AI providers</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_CONNECTORS.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              active={(org.aiProvider ?? "mistral") === connector.id}
              onSelectProvider={() => setAiProvider(orgId, connector.id)}
            />
          ))}
        </div>
      </section>

      {pickerConnector && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          data-testid="connector-picker-modal"
        >
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Connect source</p>
                <h3 className="text-base font-semibold text-foreground">
                  Select items from {pickerConnector.name}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setPickerConnector(null)}
                className="p-1 rounded hover:bg-muted/50 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {items.map((item: ConnectorItem) => (
                <li key={item.id}>
                  <label className="flex items-start gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                      data-testid={`picker-item-${item.id}`}
                    />
                    <span>
                      <span className="text-sm font-medium text-foreground block">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.filename}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              data-testid="ingest-selected"
              disabled={selectedItems.size === 0}
              onClick={ingestSelected}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              Ingest selected ({selectedItems.size})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
