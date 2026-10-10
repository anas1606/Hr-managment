import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status, session } = await requireSession(["ADMIN"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const { id } = await params;
  const body = await req.json();
  const { status: leaveStatus, adminNote } = body as {
    status?: "APPROVED" | "REJECTED";
    adminNote?: string;
  };

  if (!leaveStatus || !["APPROVED", "REJECTED"].includes(leaveStatus)) {
    return NextResponse.json(
      { error: "status must be APPROVED or REJECTED" },
      { status: 400 }
    );
  }

  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Leave not found" }, { status: 404 });
  }

  const leave = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: leaveStatus,
      adminNote: adminNote?.trim() || null,
    },
    include: {
      user: { select: { id: true, name: true, username: true } },
    },
  });

  return NextResponse.json({ leave });
}
