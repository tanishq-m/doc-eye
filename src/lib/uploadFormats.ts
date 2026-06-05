import path from "node:path";

export const ALLOWED_UPLOAD_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".md",
  ".txt",
  ".pptx",
  ".ppt",
] as const;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "text/markdown",
  "text/plain",
] as const;

export const UPLOAD_ACCEPT_ATTR = ".pdf,.docx,.md,.txt,.pptx,.ppt";

export function uploadExtension(filename: string): string {
  return "." + filename.split(".").pop()?.toLowerCase();
}

export function isAllowedUploadExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return (ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(ext);
}

export function isAllowedUploadFile(file: File): boolean {
  const ext = uploadExtension(file.name);
  return (
    (ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(ext) ||
    (ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(file.type)
  );
}
