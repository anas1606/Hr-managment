import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status, session } = await requireSession(["ADMIN"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      staffProfile: true,
      documents: { orderBy: { createdAt: "desc" } },
      salarySlips: { orderBy: [{ year: "desc" }, { month: "desc" }] },
    },
  });

  if (!user || user.role !== "STAFF") {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  }

  const profile = user.staffProfile;

  return NextResponse.json({
    staff: {
      id: user.id,
      name: user.name,
      username: user.username,
      employeeId: profile?.employeeId || "",
      phone: profile?.phone || "",
      department: profile?.department || "",
      isActive: profile?.isActive ?? true,
      avatarPath: profile?.avatarPath || null,
      bankAccountHolder: profile?.bankAccountHolder || "",
      bankName: profile?.bankName || "",
      accountNumber: profile?.accountNumber || "",
      ifscCode: profile?.ifscCode || "",
      branchName: profile?.branchName || "",
      documents: user.documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        filePath: doc.filePath,
        createdAt: doc.createdAt,
      })),
      slips: user.salarySlips.map((slip) => ({
        id: slip.id,
        month: slip.month,
        year: slip.year,
        fileName: slip.fileName,
        filePath: slip.filePath,
        netPay: slip.netPay,
        createdAt: slip.createdAt,
      })),
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status, session } = await requireSession(["ADMIN"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const { id } = await params;
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

  const user = await prisma.user.findUnique({
    where: { id },
    include: { staffProfile: true },
  });

  if (!user || user.role !== "STAFF") {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  }

  if (username) {
    const normalized = username.trim().toLowerCase();
    const clash = await prisma.user.findFirst({
      where: { username: normalized, NOT: { id } },
    });
    if (clash) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(name ? { name: name.trim() } : {}),
      ...(username ? { username: username.trim().toLowerCase() } : {}),
      ...(password ? { passwordHash: await hash(password, 10) } : {}),
      staffProfile: {
        upsert: {
          create: {
            employeeId: employeeId?.trim() || null,
            phone: phone?.trim() || null,
            department: department?.trim() || null,
            isActive: isActive ?? true,
          },
          update: {
            ...(employeeId !== undefined
              ? { employeeId: employeeId?.trim() || null }
              : {}),
            ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
            ...(department !== undefined
              ? { department: department?.trim() || null }
              : {}),
            ...(isActive !== undefined ? { isActive } : {}),
          },
        },
      },
    },
    include: { staffProfile: true },
  });

  return NextResponse.json({
    staff: {
      id: updated.id,
      name: updated.name,
      username: updated.username,
      employeeId: updated.staffProfile?.employeeId || "",
      phone: updated.staffProfile?.phone || "",
      department: updated.staffProfile?.department || "",
      isActive: updated.staffProfile?.isActive ?? true,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status, session } = await requireSession(["ADMIN"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "STAFF") {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
