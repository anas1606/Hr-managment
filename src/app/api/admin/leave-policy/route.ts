import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { DEFAULT_LEAVE_POLICY, getLeavePolicy } from "@/lib/leave-policy";

export async function GET() {
  const { error, status, session } = await requireSession(["ADMIN"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const policy = await getLeavePolicy(prisma);
  return NextResponse.json({ policy });
}

export async function PUT(req: NextRequest) {
  const { error, status, session } = await requireSession(["ADMIN"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const body = await req.json();
  const plPerMonth = Number(body.plPerMonth);
  const plPerYear = Number(body.plPerYear);
  const yearEndMonth = Number(body.yearEndMonth ?? 12);

  if (
    !Number.isFinite(plPerMonth) ||
    plPerMonth <= 0 ||
    !Number.isFinite(plPerYear) ||
    plPerYear <= 0 ||
    !Number.isInteger(yearEndMonth) ||
    yearEndMonth < 1 ||
    yearEndMonth > 12
  ) {
    return NextResponse.json(
      { error: "Invalid PL policy values" },
      { status: 400 }
    );
  }

  const policy = await prisma.leavePolicy.upsert({
    where: { id: "default" },
    update: { plPerMonth, plPerYear, yearEndMonth },
    create: {
      id: "default",
      plPerMonth,
      plPerYear,
      yearEndMonth,
    },
  });

  return NextResponse.json({
    policy: {
      plPerMonth: policy.plPerMonth,
      plPerYear: policy.plPerYear,
      yearEndMonth: policy.yearEndMonth,
    },
    defaults: DEFAULT_LEAVE_POLICY,
  });
}
