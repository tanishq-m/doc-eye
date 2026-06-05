import { AzureOpenAI } from "openai";
import type { QueryResponse, ProcessPlan } from "@/types";
import { env } from "@/lib/env";

let embeddingClient: AzureOpenAI | null = null;

function getEmbeddingClient(): AzureOpenAI {
  if (!embeddingClient) {
    embeddingClient = new AzureOpenAI({
      endpoint: env("AZURE_OPENAI_EMBEDDING_ENDPOINT"),
      apiKey: env("AZURE_OPENAI_EMBEDDING_API_KEY"),
      apiVersion: "2024-10-21",
      deployment: env("AZURE_OPENAI_EMBEDDING_DEPLOYMENT"),
    });
  }
  return embeddingClient;
}

export async function mistralChat(
  messages: { role: string; content: string }[],
  options?: { temperature?: number; max_tokens?: number; response_format?: { type: string } }
): Promise<string> {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env("MISTRAL_API_KEY")}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.max_tokens ?? 1000,
      ...(options?.response_format ? { response_format: options.response_format } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mistral API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices[0].message.content ?? "";
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getEmbeddingClient();
  const response = await client.embeddings.create({
    input: text,
    model: env("AZURE_OPENAI_EMBEDDING_DEPLOYMENT"),
  });
  return response.data[0].embedding;
}

export async function generateAnswer(
  question: string,
  contextDocs: { title: string; filename: string; content: string }[],
  additionalSystemPrompt?: string
): Promise<QueryResponse> {
  const contextText = contextDocs
    .map((d) => `[${d.title} (${d.filename})]:\n${d.content}`)
    .join("\n\n---\n\n");

  const baseSystem =
    "You are an enterprise knowledge assistant. Answer the user's question using ONLY the provided documents. If the answer is not fully covered by the documents, say so clearly. Be concise and factual.";

  const systemContent = additionalSystemPrompt?.trim()
    ? `${baseSystem}\n\n${additionalSystemPrompt}`
    : baseSystem;

  const answer = await mistralChat(
    [
      { role: "system", content: systemContent },
      { role: "user", content: `Documents:\n${contextText}\n\nQuestion: ${question}` },
    ],
    { temperature: 0.2, max_tokens: 1000 }
  );

  return {
    answer,
    sources: contextDocs.map((d) => ({ title: d.title, filename: d.filename })),
    confidence: answer.length < 200 ? "high" : answer.length < 500 ? "medium" : "low",
  };
}

export async function generateProcessPlan(
  description: string,
  contextDocs: { title: string; filename: string; content: string }[]
): Promise<ProcessPlan> {
  const contextText = contextDocs
    .map((d) => `[${d.title}]:\n${d.content}`)
    .join("\n\n---\n\n");

  const raw = await mistralChat([
    {
      role: "system",
      content: `You are an enterprise process architect. Generate a structured process plan based on the provided documentation.
Return ONLY valid JSON in this exact shape:
{
  "title": "string",
  "steps": ["string"],
  "requiredInputs": ["string"],
  "dependencies": ["string"],
  "validationChecklist": ["string"]
}`,
    },
    {
      role: "user",
      content: `Documentation:\n${contextText}\n\nGenerate a process plan for: ${description}`,
    },
  ], { temperature: 0.3, max_tokens: 1500, response_format: { type: "json_object" } });

  return JSON.parse(raw) as ProcessPlan;
}

export async function generateDocumentDraft(
  gapName: string,
  referencingDocContents: string[]
): Promise<string> {
  const context = referencingDocContents.join("\n\n---\n\n");

  return await mistralChat([
    {
      role: "system",
      content:
        "You are a technical writer. Generate a concise draft for a missing enterprise document based on how it is referenced in existing documentation. The draft should be in Markdown.",
    },
    {
      role: "user",
      content: `The document "${gapName}" is referenced but does not exist. Based on these documents that reference it:\n\n${context}\n\nGenerate a draft for "${gapName}".`,
    },
  ], { temperature: 0.4, max_tokens: 800 });
}
