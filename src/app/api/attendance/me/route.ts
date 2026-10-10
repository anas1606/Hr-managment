import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { todayDate, toDateOnly } from "@/lib/utils";
import { endOfMonth, startOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const { error, status, session } = await requireSession(["STAFF"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const monthParam = req.nextUrl.searchParams.get("month");
  const base = monthParam ? toDateOnly(`${monthParam}-01`) : todayDate();
  const from = startOfMonth(base);
  const to = endOfMonth(base);

  const [today, history, holidays, leaves] = await Promise.all([
    prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: todayDate(),
        },
      },
    }),
    prisma.attendance.findMany({
      where: {
        userId: session.user.id,
        date: { gte: from, lte: to },
      },
      orderBy: { date: "desc" },
    }),
    prisma.holiday.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    }),
    prisma.leaveRequest.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["PENDING", "APPROVED"] },
        fromDate: { lte: to },
        toDate: { gte: from },
      },
      orderBy: { fromDate: "desc" },
    }),
  ]);

  return NextResponse.json({ today, history, holidays, leaves });
}
