"use client";

import { useState, useCallback } from "react";

export default function UploadPanel() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setMessage(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setMessage({ type: "success", text: `"${data.title}" uploaded and indexed.` });
      setUploadCount((n) => n + 1);
    } catch (e: unknown) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Upload failed." });
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6 flex flex-col gap-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          dragging ? "border-blue-500 bg-blue-500/10" : "border-slate-600 hover:border-blue-400/50"
        }`}
      >
        <p className="text-3xl mb-3">📁</p>
        <p className="text-slate-300 text-sm">
          Drag & drop your <strong className="text-white">PDF</strong>, <strong className="text-white">DOCX</strong>, <strong className="text-white">Markdown</strong>, or <strong className="text-white">Text</strong> file
        </p>
        <p className="text-slate-500 text-xs mt-2">or</p>
        <label className="mt-3 inline-block cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm px-5 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/20">
          {uploading ? "Uploading…" : "Browse Files"}
          <input type="file" accept=".pdf,.docx,.md,.txt" className="hidden" onChange={onInputChange} disabled={uploading} />
        </label>
      </div>
      {message && (
        <div className={`text-sm px-4 py-3 rounded-lg flex items-center gap-2 ${message.type === "success" ? "bg-green-500/10 border border-green-500/30 text-green-300" : "bg-red-500/10 border border-red-500/30 text-red-300"}`}>
          <span>{message.type === "success" ? "✓" : "✕"}</span>
          <span>{message.text}</span>
        </div>
      )}
      {uploadCount > 0 && (
        <p className="text-xs text-slate-400">✓ {uploadCount} document{uploadCount > 1 ? "s" : ""} uploaded this session</p>
      )}
    </div>
  );
}
