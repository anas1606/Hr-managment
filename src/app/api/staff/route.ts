import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const { error, status, session } = await requireSession(["ADMIN"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const staff = await prisma.user.findMany({
    where: { role: "STAFF" },
    include: { staffProfile: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    staff: staff.map((s) => ({
      id: s.id,
      name: s.name,
      username: s.username,
      employeeId: s.staffProfile?.employeeId || "",
      phone: s.staffProfile?.phone || "",
      department: s.staffProfile?.department || "",
      isActive: s.staffProfile?.isActive ?? true,
      createdAt: s.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { error, status, session } = await requireSession(["ADMIN"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const body = await req.json();
  const { name, username, password, employeeId, phone, department, isActive } =
    body as {
      name?: string;
      username?: string;
      password?: string;
      employeeId?: string;
      phone?: string;
      department?: string;
      isActive?: boolean;
    };

  if (!name?.trim() || !username?.trim() || !password) {
    return NextResponse.json(
      { error: "name, username and password are required" },
      { status: 400 }
    );
  }

  const normalized = username.trim().toLowerCase();
  const exists = await prisma.user.findUnique({ where: { username: normalized } });
  if (exists) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 }
    );
  }

  const passwordHash = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      username: normalized,
      passwordHash,
      role: "STAFF",
      staffProfile: {
        create: {
          employeeId: employeeId?.trim() || null,
          phone: phone?.trim() || null,
          department: department?.trim() || null,
          isActive: isActive ?? true,
        },
      },
    },
    include: { staffProfile: true },
  });

  return NextResponse.json(
    {
      staff: {
        id: user.id,
        name: user.name,
        username: user.username,
        employeeId: user.staffProfile?.employeeId || "",
        phone: user.staffProfile?.phone || "",
        department: user.staffProfile?.department || "",
        isActive: user.staffProfile?.isActive ?? true,
      },
    },
    { status: 201 }
  );
}
