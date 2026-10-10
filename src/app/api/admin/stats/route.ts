import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { todayDate } from "@/lib/utils";

export async function GET() {
  const { error, status, session } = await requireSession(["ADMIN"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const date = todayDate();

  const [staffCount, presentToday, pendingLeaves, holidaysCount] =
    await Promise.all([
      prisma.user.count({ where: { role: "STAFF", staffProfile: { isActive: true } } }),
      prisma.attendance.count({
        where: { date, checkInAt: { not: null } },
      }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.holiday.count(),
    ]);

  return NextResponse.json({
    staffCount,
    presentToday,
    pendingLeaves,
    holidaysCount,
  });
}
