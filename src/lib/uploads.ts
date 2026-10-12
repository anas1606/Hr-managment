import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { put } from "@vercel/blob";

/** Vercel serverless body limit is ~4.5MB — keep under that for server uploads. */
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function useBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isVercelRuntime() {
  return process.env.VERCEL === "1";
}

export async function saveUpload(
  file: File,
  folder: string,
  options?: { imagesOnly?: boolean }
): Promise<{ fileName: string; filePath: string }> {
  const allowed = options?.imagesOnly ? IMAGE_TYPES : ALLOWED;
  if (!allowed.has(file.type)) {
    throw new Error(
      options?.imagesOnly
        ? "Only JPG, PNG or WEBP images are allowed"
        : "Only PDF, JPG, PNG or WEBP files are allowed"
    );
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File must be 4MB or smaller");
  }

  const ext = path.extname(file.name) || mimeExt(file.type);
  const safeBase = file.name
    .replace(ext, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 40);
  const unique = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const storedName = `${safeBase || "file"}-${unique}${ext}`;
  const pathname = `${folder.replace(/\\/g, "/")}/${storedName}`;

  // On Vercel, local disk is ephemeral — Blob storage is required.
  if (isVercelRuntime() && !useBlobStorage()) {
    throw new Error(
      "File storage is not configured. Add BLOB_READ_WRITE_TOKEN from Vercel Storage → Blob."
    );
  }

  if (useBlobStorage()) {
    const blob = await put(pathname, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      contentType: file.type,
    });
    return {
      fileName: file.name,
      filePath: blob.url,
    };
  }

  // Local development only
  const relativeDir = path.join("uploads", folder);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(absoluteDir, storedName), buffer);

  return {
    fileName: file.name,
    filePath: `/${relativeDir.replace(/\\/g, "/")}/${storedName}`,
  };
}

function mimeExt(type: string) {
  switch (type) {
    case "application/pdf":
      return ".pdf";
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}
