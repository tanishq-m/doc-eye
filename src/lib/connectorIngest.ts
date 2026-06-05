import { mockExtractFromContent } from "@/lib/entityExtractor";
import type { ConnectorItem } from "@/lib/connectors";
import type { ExtractedGraph, UploadedDocument } from "@/types";

export interface IngestedConnectorItem {
  doc: UploadedDocument;
  extracted: ExtractedGraph;
}

export function ingestConnectorItem(
  orgId: string,
  connectorId: string,
  item: ConnectorItem
): IngestedConnectorItem {
  const doc: UploadedDocument = {
    id: `${connectorId}-${item.id}-${Date.now()}`,
    title: item.title,
    filename: item.filename,
    content: item.content,
    uploadedAt: new Date().toISOString(),
  };

  const extracted = mockExtractFromContent(doc.id, doc.title, doc.content);
  for (const entity of extracted.entities) {
    entity.docIds = [doc.id];
  }

  return { doc, extracted };
}

export function ingestConnectorItems(
  orgId: string,
  connectorId: string,
  items: ConnectorItem[]
): IngestedConnectorItem[] {
  return items.map((item) => ingestConnectorItem(orgId, connectorId, item));
}
