import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { toDateOnly } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { error, status, session } = await requireSession();
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const statusFilter = req.nextUrl.searchParams.get("status") || undefined;

  const leaves = await prisma.leaveRequest.findMany({
    where: {
      ...(session.user.role === "STAFF" ? { userId: session.user.id } : {}),
      ...(statusFilter
        ? { status: statusFilter as "PENDING" | "APPROVED" | "REJECTED" }
        : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          staffProfile: { select: { employeeId: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leaves });
}

export async function POST(req: NextRequest) {
  const { error, status, session } = await requireSession(["STAFF"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const body = await req.json();
  const { fromDate, toDate, reason } = body as {
    fromDate?: string;
    toDate?: string;
    reason?: string;
  };

  if (!fromDate || !toDate || !reason?.trim()) {
    return NextResponse.json(
      { error: "fromDate, toDate and reason are required" },
      { status: 400 }
    );
  }

  const from = toDateOnly(fromDate);
  const to = toDateOnly(toDate);

  if (to < from) {
    return NextResponse.json(
      { error: "toDate must be on or after fromDate" },
      { status: 400 }
    );
  }

  const leave = await prisma.leaveRequest.create({
    data: {
      userId: session.user.id,
      fromDate: from,
      toDate: to,
      reason: reason.trim(),
    },
  });

  return NextResponse.json({ leave }, { status: 201 });
}
