import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { todayDate } from "@/lib/utils";

async function todayAttendance(userId: string) {
  return prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: todayDate(),
      },
    },
    include: {
      breaks: { orderBy: { startAt: "asc" } },
    },
  });
}

export async function POST() {
  const { error, status, session } = await requireSession(["STAFF"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const attendance = await todayAttendance(session.user.id);

  if (!attendance?.checkInAt) {
    return NextResponse.json(
      { error: "Check in before taking a break" },
      { status: 400 }
    );
  }

  if (attendance.checkOutAt) {
    return NextResponse.json(
      { error: "Already checked out for today" },
      { status: 400 }
    );
  }

  const openBreak = attendance.breaks.find((b) => !b.endAt);
  if (openBreak) {
    return NextResponse.json(
      { error: "Already on a break" },
      { status: 400 }
    );
  }

  await prisma.break.create({
    data: {
      attendanceId: attendance.id,
      startAt: new Date(),
    },
  });

  const record = await todayAttendance(session.user.id);
  return NextResponse.json({ action: "BREAK_START", record });
}

export async function PATCH() {
  const { error, status, session } = await requireSession(["STAFF"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const attendance = await todayAttendance(session.user.id);

  if (!attendance?.checkInAt) {
    return NextResponse.json(
      { error: "No attendance for today" },
      { status: 400 }
    );
  }

  const openBreak = attendance.breaks.find((b) => !b.endAt);
  if (!openBreak) {
    return NextResponse.json(
      { error: "No active break to end" },
      { status: 400 }
    );
  }

  await prisma.break.update({
    where: { id: openBreak.id },
    data: { endAt: new Date() },
  });

  const record = await todayAttendance(session.user.id);
  return NextResponse.json({ action: "BREAK_END", record });
}
