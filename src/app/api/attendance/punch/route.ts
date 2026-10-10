import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { todayDate } from "@/lib/utils";

export async function POST() {
  const { error, status, session } = await requireSession(["STAFF"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const date = todayDate();
  const now = new Date();

  const existing = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date,
      },
    },
  });

  if (!existing) {
    const record = await prisma.attendance.create({
      data: {
        userId: session.user.id,
        date,
        checkInAt: now,
      },
    });
    return NextResponse.json({ action: "CHECK_IN", record });
  }

  if (!existing.checkInAt) {
    const record = await prisma.attendance.update({
      where: { id: existing.id },
      data: { checkInAt: now },
    });
    return NextResponse.json({ action: "CHECK_IN", record });
  }

  if (existing.checkOutAt) {
    return NextResponse.json(
      { error: "Already checked out for today" },
      { status: 400 }
    );
  }

  const record = await prisma.attendance.update({
    where: { id: existing.id },
    data: { checkOutAt: now },
  });

  return NextResponse.json({ action: "CHECK_OUT", record });
}

/** Delete today's punch log so staff can punch again */
export async function DELETE() {
  const { error, status, session } = await requireSession(["STAFF"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const date = todayDate();

  const existing = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date,
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "No punch log for today" },
      { status: 404 }
    );
  }

  await prisma.attendance.delete({ where: { id: existing.id } });

  return NextResponse.json({ ok: true });
}
