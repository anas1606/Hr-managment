import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { deleteUpload } from "@/lib/uploads";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { error, status } = await requireSession(["ADMIN"]);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const userId = req.nextUrl.searchParams.get("userId") || undefined;

    const documents = await prisma.staffDocument.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (e) {
    console.error("GET /api/admin/documents", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load documents" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { error, status } = await requireSession(["ADMIN"]);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Document id is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.staffDocument.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await deleteUpload(existing.filePath);
    await prisma.staffDocument.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/documents", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete document" },
      { status: 500 }
    );
  }
}
