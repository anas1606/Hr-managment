import { NextResponse } from "next/server";
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
    },
  });
}
