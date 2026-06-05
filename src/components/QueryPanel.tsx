"use client";

import { useState } from "react";
import type { QueryResponse, ProcessPlan } from "@/types";
import ResponseCard from "@/components/ResponseCard";

export default function QueryPanel() {
  const [mode, setMode] = useState<"ask" | "process">("ask");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
  const [processResult, setProcessResult] = useState<ProcessPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setQueryResult(null);
    setProcessResult(null);

    try {
      if (mode === "ask") {
        const res = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: input }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setQueryResult(data as QueryResponse);
      } else {
        const res = await fetch("/api/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: input }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setProcessResult(data as ProcessPlan);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6 flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          onClick={() => setMode("ask")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            mode === "ask" ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20" : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          ❓ Ask a Question
        </button>
        <button
          onClick={() => setMode("process")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            mode === "process" ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20" : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          ⚙️ Generate Process
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "ask" ? "What would you like to know?" : "Describe the process to generate..."}
          className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
        >
          {loading ? "…" : mode === "ask" ? "Ask" : "Generate"}
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}

      {queryResult && <ResponseCard type="query" data={queryResult} />}
      {processResult && <ResponseCard type="process" data={processResult} />}
    </div>
  );
}
