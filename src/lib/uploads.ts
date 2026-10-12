import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/** Keep under Vercel serverless body limit (~4.5MB). */
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Root folder in the shared AVX S3 bucket */
const S3_ROOT_FOLDER = "Hr-management";

function s3Config() {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_S3_REGION || "ap-south-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) return null;
  return { bucket, region, accessKeyId, secretAccessKey };
}

function publicUrl(bucket: string, region: string, key: string) {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
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
  const relativeFolder = folder.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");

  const aws = s3Config();
  if (aws) {
    const key = `${S3_ROOT_FOLDER}/${relativeFolder}/${storedName}`;
    const client = new S3Client({
      region: aws.region,
      credentials: {
        accessKeyId: aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey,
      },
    });

    const body = Buffer.from(await file.arrayBuffer());
    await client.send(
      new PutObjectCommand({
        Bucket: aws.bucket,
        Key: key,
        Body: body,
        ContentType: file.type,
      })
    );

    return {
      fileName: file.name,
      filePath: publicUrl(aws.bucket, aws.region, key),
    };
  }

  // Local fallback when AWS env vars are not set
  if (process.env.VERCEL === "1") {
    throw new Error(
      "S3 is not configured. Set AWS_S3_BUCKET, AWS_S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY."
    );
  }

  const relativeDir = path.join("uploads", relativeFolder);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(absoluteDir, storedName), buffer);

  return {
    fileName: file.name,
    filePath: `/${relativeDir.replace(/\\/g, "/")}/${storedName}`,
  };
}

/** Best-effort delete for S3 or local public uploads. */
export async function deleteUpload(filePath: string): Promise<void> {
  if (!filePath) return;

  const aws = s3Config();
  if (aws && filePath.includes(".amazonaws.com/")) {
    try {
      const url = new URL(filePath);
      const key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
      if (!key.startsWith(`${S3_ROOT_FOLDER}/`)) return;
      const client = new S3Client({
        region: aws.region,
        credentials: {
          accessKeyId: aws.accessKeyId,
          secretAccessKey: aws.secretAccessKey,
        },
      });
      await client.send(
        new DeleteObjectCommand({
          Bucket: aws.bucket,
          Key: key,
        })
      );
    } catch (e) {
      console.error("S3 delete failed", e);
    }
    return;
  }

  if (filePath.startsWith("/uploads/")) {
    try {
      await unlink(path.join(process.cwd(), "public", filePath));
    } catch {
      // ignore missing local files
    }
  }
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
