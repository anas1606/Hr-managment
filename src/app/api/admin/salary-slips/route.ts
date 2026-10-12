import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { saveUpload } from "@/lib/uploads";

export async function GET(req: NextRequest) {
  const { error, status } = await requireSession(["ADMIN"]);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  const userId = req.nextUrl.searchParams.get("userId") || undefined;
  const slips = await prisma.salarySlip.findMany({
    where: userId ? { userId } : undefined,
    include: { user: { select: { name: true, username: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return NextResponse.json({ slips });
}

export async function POST(req: NextRequest) {
  const { error, status } = await requireSession(["ADMIN"]);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  const form = await req.formData();
  const userId = String(form.get("userId") || "").trim();
  const month = Number(form.get("month"));
  const year = Number(form.get("year"));
  const netPayRaw = form.get("netPay");
  const netPay =
    netPayRaw != null && String(netPayRaw).trim() !== ""
      ? Number(netPayRaw)
      : null;
  const file = form.get("file");

  if (!userId || !month || !year) {
    return NextResponse.json(
      { error: "userId, month and year are required" },
      { status: 400 }
    );
  }
  if (month < 1 || month > 12 || year < 2000) {
    return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a salary slip file" }, { status: 400 });
  }

  const staff = await prisma.user.findFirst({
    where: { id: userId, role: "STAFF" },
  });
  if (!staff) {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  }

  try {
    const saved = await saveUpload(file, `salary/${userId}`);
    const slip = await prisma.salarySlip.upsert({
      where: {
        userId_month_year: { userId, month, year },
      },
      create: {
        userId,
        month,
        year,
        fileName: saved.fileName,
        filePath: saved.filePath,
        netPay: Number.isFinite(netPay as number) ? netPay : null,
      },
      update: {
        fileName: saved.fileName,
        filePath: saved.filePath,
        netPay: Number.isFinite(netPay as number) ? netPay : null,
      },
    });
    return NextResponse.json({ slip }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 }
    );
  }
}
