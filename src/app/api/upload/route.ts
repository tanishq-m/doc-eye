import { NextRequest, NextResponse } from "next/server";
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import { extractTextFromFile, deriveTitle } from "@/lib/documentProcessor";
import { extractEntities } from "@/lib/entityExtractor";
import { indexDocument } from "@/lib/search";
import { ALLOWED_UPLOAD_EXTENSIONS, isAllowedUploadFile } from "@/lib/uploadFormats";
import { hasBlobStorage, env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const orgId = String(formData.get("orgId") ?? "").trim();

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "No orgId provided." }, { status: 400 });
    }

    if (!isAllowedUploadFile(file)) {
      return NextResponse.json(
        {
          error: `Unsupported file type. Upload PDF, DOCX, PPTX, Markdown, or text (${ALLOWED_UPLOAD_EXTENSIONS.join(", ")}).`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const id = uuidv4();
    const title = deriveTitle(file.name);

    // Blob storage is optional — skip if env vars not configured
    if (hasBlobStorage()) {
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        env("AZURE_STORAGE_CONNECTION_STRING")
      );
      const containerClient = blobServiceClient.getContainerClient(
        env("AZURE_STORAGE_CONTAINER").trim()
      );
      await containerClient.createIfNotExists();
      const blobClient = containerClient.getBlockBlobClient(`${orgId}/${id}-${file.name}`);
      await blobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: file.type },
      });
    }

    const content = await extractTextFromFile(buffer, file.type, file.name);
    const extracted = await extractEntities(content, { docId: id, title });
    await indexDocument(orgId, id, title, file.name, content);

    return NextResponse.json({
      id,
      title,
      filename: file.name,
      content,
      extracted,
      message: "Document uploaded and indexed.",
    });
  } catch (err) {
    console.error("[upload]", err);
    const message =
      err instanceof Error ? err.message : "Upload failed. Check server logs.";
    const hint = message.includes("not authorized")
      ? "Azure Blob Storage rejected the request — verify AZURE_STORAGE_CONNECTION_STRING and container permissions."
      : message.includes("orgId")
        ? "Azure AI Search index is missing the orgId field — restart dev server after pulling latest code."
        : undefined;
    return NextResponse.json(
      { error: hint ? `${message} ${hint}` : message },
      { status: 500 }
    );
  }
}
