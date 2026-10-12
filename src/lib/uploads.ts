import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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
    throw new Error("File must be 8MB or smaller");
  }

  const ext = path.extname(file.name) || mimeExt(file.type);
  const safeBase = file.name
    .replace(ext, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 40);
  const unique = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const fileName = `${safeBase || "file"}-${unique}${ext}`;
  const relativeDir = path.join("uploads", folder);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(absoluteDir, fileName), buffer);

  return {
    fileName: file.name,
    filePath: `/${relativeDir.replace(/\\/g, "/")}/${fileName}`,
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
