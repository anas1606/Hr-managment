import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { toDateOnly } from "@/lib/utils";

export async function GET() {
  const { error, status, session } = await requireSession();
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const holidays = await prisma.holiday.findMany({
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ holidays });
}

export async function POST(req: NextRequest) {
  const { error, status, session } = await requireSession(["ADMIN"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const body = await req.json();
  const { date, name } = body as { date?: string; name?: string };

  if (!date || !name?.trim()) {
    return NextResponse.json(
      { error: "date and name are required" },
      { status: 400 }
    );
  }

  try {
    const holiday = await prisma.holiday.create({
      data: {
        date: toDateOnly(date),
        name: name.trim(),
      },
    });
    return NextResponse.json({ holiday }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Holiday already exists for this date" },
      { status: 409 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { error, status, session } = await requireSession(["ADMIN"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.holiday.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
