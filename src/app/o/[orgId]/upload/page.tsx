"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { Upload } from "lucide-react";
import ProcessingScreen, { type ProcessingStage } from "@/components/ProcessingScreen";
import { uploadDocument } from "@/lib/uploadClient";
import { isAllowedUploadFile, UPLOAD_ACCEPT_ATTR } from "@/lib/uploadFormats";
import { useCorpusStore } from "@/store/corpus";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickAllowedFiles(fileList: FileList | File[]): File[] {
  return Array.from(fileList).filter(isAllowedUploadFile);
}

export default function UploadPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const org = useCorpusStore((s) => s.orgs[orgId]);
  const addDocument = useCorpusStore((s) => s.addDocument);

  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<ProcessingStage | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileProgress, setFileProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [usedMockFallback, setUsedMockFallback] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetUpload = useCallback(() => {
    setStage(null);
    setActiveFile(null);
    setFileProgress(null);
    setUsedMockFallback(false);
    setLiveError(null);
    setErrorMessage(null);
  }, []);

  const runUploadBatch = useCallback(
    async (files: File[]) => {
      if (!org || files.length === 0) return;

      setBusy(true);
      setUsedMockFallback(false);
      setLiveError(null);
      setErrorMessage(null);
      setFileProgress({ current: 1, total: files.length });

      let anyMockFallback = false;
      let lastLiveError: string | null = null;

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setActiveFile(file.name);
          setFileProgress({ current: i + 1, total: files.length });
          setStage("uploading");

          await delay(350);
          setStage("extracting");
          const result = await uploadDocument(orgId, file);
          if (result.usedMockFallback) {
            anyMockFallback = true;
            lastLiveError = result.liveError ?? lastLiveError;
          }

          setStage("graphing");
          await delay(300);
          addDocument(orgId, result.doc, result.extracted);

          setStage("scoring");
          await delay(300);
        }

        setUsedMockFallback(anyMockFallback);
        setLiveError(lastLiveError);
        setStage("done");
      } catch (e: unknown) {
        setStage("error");
        setErrorMessage(e instanceof Error ? e.message : "Upload failed.");
      } finally {
        setBusy(false);
      }
    },
    [addDocument, org, orgId]
  );

  const onFilesSelected = useCallback(
    (fileList: FileList | File[]) => {
      if (busy) return;
      const files = pickAllowedFiles(fileList);
      if (files.length > 0) void runUploadBatch(files);
    },
    [busy, runUploadBatch]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      onFilesSelected(e.dataTransfer.files);
    },
    [onFilesSelected]
  );

  if (!org) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Organization not found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="upload-page">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Upload
        </p>
        <p className="text-sm text-muted-foreground">
          Add documents to <span className="text-foreground font-medium">{org.name}</span>. Files
          are stored under this org and extracted into its isolated knowledge graph.
        </p>
      </div>

      {stage ? (
        <ProcessingScreen
          stage={stage}
          filename={activeFile ?? undefined}
          fileProgress={fileProgress ?? undefined}
          usedMockFallback={usedMockFallback}
          liveError={liveError ?? undefined}
          errorMessage={errorMessage ?? undefined}
          onUploadAnother={stage === "done" || stage === "error" ? resetUpload : undefined}
          orgId={stage === "done" ? orgId : undefined}
        />
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          data-testid="upload-dropzone"
          className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragging
              ? "border-accent bg-accent/10"
              : "border-border bg-card hover:border-accent/50"
          }`}
        >
          <Upload className="h-10 w-10 mx-auto mb-4 text-accent" aria-hidden />
          <p className="text-sm text-foreground font-medium mb-1">
            Drag & drop PDF, DOCX, PPTX, Markdown, or text
          </p>
          <p className="text-xs text-muted-foreground mb-1">
            Select multiple files at once — they upload one after another
          </p>
          <p className="text-xs text-muted-foreground mb-4">or browse from your computer</p>
          <label className="inline-flex cursor-pointer items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90">
            Browse files
            <input
              type="file"
              multiple
              accept={UPLOAD_ACCEPT_ATTR}
              className="hidden"
              data-testid="upload-input"
              disabled={busy}
              onChange={(e) => {
                if (e.target.files) onFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
