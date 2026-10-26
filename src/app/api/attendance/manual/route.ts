import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { istDateTime, toDateOnly } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { error, status } = await requireSession(["ADMIN"]);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const body = await req.json();
    const userId = String(body.userId || "").trim();
    const dateStr = String(body.date || "").trim();
    const checkInTime = String(body.checkInTime || "").trim();
    const checkOutTime = String(body.checkOutTime || "").trim();

    if (!userId || !dateStr || !checkInTime) {
      return NextResponse.json(
        { error: "Staff, date and check-in time are required" },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    if (!/^\d{2}:\d{2}$/.test(checkInTime)) {
      return NextResponse.json(
        { error: "Invalid check-in time" },
        { status: 400 }
      );
    }
    if (checkOutTime && !/^\d{2}:\d{2}$/.test(checkOutTime)) {
      return NextResponse.json(
        { error: "Invalid check-out time" },
        { status: 400 }
      );
    }

    const staff = await prisma.user.findFirst({
      where: { id: userId, role: "STAFF" },
    });
    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Calendar date + times interpreted in IST (not Vercel UTC)
    const date = toDateOnly(dateStr);
    const checkInAt = istDateTime(dateStr, checkInTime);
    const checkOutAt = checkOutTime
      ? istDateTime(dateStr, checkOutTime)
      : null;

    if (checkOutAt && checkOutAt < checkInAt) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
        { status: 400 }
      );
    }

    const record = await prisma.attendance.upsert({
      where: {
        userId_date: { userId, date },
      },
      create: {
        userId,
        date,
        checkInAt,
        checkOutAt,
      },
      update: {
        checkInAt,
        checkOutAt,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            staffProfile: { select: { employeeId: true, department: true } },
          },
        },
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (e) {
    console.error("POST /api/attendance/manual", e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to save attendance",
      },
      { status: 500 }
    );
  }
}
