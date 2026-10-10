import { NextRequest, NextResponse } from "next/server";
import { LeaveType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { todayDate, toDateOnly } from "@/lib/utils";
import { getPlBalance, leaveDays } from "@/lib/leave-policy";

const LEAVE_TYPES: LeaveType[] = ["PL", "GL", "SL"];

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
  const { fromDate, toDate, reason, type } = body as {
    fromDate?: string;
    toDate?: string;
    reason?: string;
    type?: string;
  };

  if (!fromDate || !toDate || !reason?.trim() || !type) {
    return NextResponse.json(
      { error: "type, fromDate, toDate and reason are required" },
      { status: 400 }
    );
  }

  if (!LEAVE_TYPES.includes(type as LeaveType)) {
    return NextResponse.json(
      { error: "type must be PL, GL or SL" },
      { status: 400 }
    );
  }

  const leaveType = type as LeaveType;
  const from = toDateOnly(fromDate);
  const to = toDateOnly(toDate);
  const today = todayDate();

  if (from < today) {
    return NextResponse.json(
      { error: "Past dates cannot be selected for day off" },
      { status: 400 }
    );
  }

  if (to < from) {
    return NextResponse.json(
      { error: "toDate must be on or after fromDate" },
      { status: 400 }
    );
  }

  const days = leaveDays(from, to);

  if (leaveType === "PL") {
    const balance = await getPlBalance(prisma, session.user.id);
    if (!balance) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (balance.available <= 0) {
      return NextResponse.json(
        {
          error:
            "No Paid Leave balance available. Choose GL or SL, or wait for next month’s accrual.",
          balance,
        },
        { status: 400 }
      );
    }
    if (days > balance.available) {
      return NextResponse.json(
        {
          error: `Not enough Paid Leave balance. Available: ${balance.available} day(s), requested: ${days}.`,
          balance,
        },
        { status: 400 }
      );
    }
  }

  const leave = await prisma.leaveRequest.create({
    data: {
      userId: session.user.id,
      type: leaveType,
      fromDate: from,
      toDate: to,
      reason: reason.trim(),
    },
  });

  return NextResponse.json({ leave }, { status: 201 });
}
