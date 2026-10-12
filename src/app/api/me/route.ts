import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const { error, status, session } = await requireSession();
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { staffProfile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      employeeId: user.staffProfile?.employeeId || null,
      phone: user.staffProfile?.phone || null,
      department: user.staffProfile?.department || null,
      avatarPath: user.staffProfile?.avatarPath || null,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const { error, status, session } = await requireSession(["STAFF"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const body = await req.json();
  const phone = String(body.phone ?? "")
    .trim()
    .replace(/\D/g, "")
    .slice(0, 10);

  if (phone && !/^\d{10}$/.test(phone)) {
    return NextResponse.json(
      { error: "Phone number must be exactly 10 digits" },
      { status: 400 }
    );
  }

  const profile = await prisma.staffProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      phone: phone || null,
    },
    update: {
      phone: phone || null,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return NextResponse.json({
    user: {
      id: user?.id,
      name: user?.name,
      username: user?.username,
      role: user?.role,
      employeeId: profile.employeeId || null,
      phone: profile.phone || null,
      department: profile.department || null,
      avatarPath: profile.avatarPath || null,
    },
  });
}
