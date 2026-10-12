import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { error, status, session } = await requireSession(["STAFF"]);
    if (error || !session) {
      return NextResponse.json({ error }, { status });
    }

    const slips = await prisma.salarySlip.findMany({
      where: { userId: session.user.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json({ slips });
  } catch (e) {
    console.error("GET /api/me/salary-slips", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load salary slips" },
      { status: 500 }
    );
  }
}
