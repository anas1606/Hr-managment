import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { saveUpload } from "@/lib/uploads";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { error, status, session } = await requireSession(["STAFF"]);
    if (error || !session) {
      return NextResponse.json({ error }, { status });
    }

    const documents = await prisma.staffDocument.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (e) {
    console.error("GET /api/me/documents", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load documents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, status, session } = await requireSession(["STAFF"]);
    if (error || !session) {
      return NextResponse.json({ error }, { status });
    }

    const form = await req.formData();
    const title = String(form.get("title") || "").trim();
    const file = form.get("file");

    if (!title) {
      return NextResponse.json(
        { error: "Document title is required" },
        { status: 400 }
      );
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Choose a file to upload" },
        { status: 400 }
      );
    }

    const saved = await saveUpload(file, `documents/${session.user.id}`);
    const document = await prisma.staffDocument.create({
      data: {
        userId: session.user.id,
        title,
        fileName: saved.fileName,
        filePath: saved.filePath,
      },
    });
    return NextResponse.json({ document }, { status: 201 });
  } catch (e) {
    console.error("POST /api/me/documents", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Staff cannot delete documents. Contact HR if a file needs removal." },
    { status: 403 }
  );
}
