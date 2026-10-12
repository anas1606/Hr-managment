import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const { error, status, session } = await requireSession(["STAFF"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const profile = await prisma.staffProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    bank: {
      bankAccountHolder: profile?.bankAccountHolder || "",
      bankName: profile?.bankName || "",
      accountNumber: profile?.accountNumber || "",
      ifscCode: profile?.ifscCode || "",
      branchName: profile?.branchName || "",
    },
  });
}

export async function PUT(req: NextRequest) {
  const { error, status, session } = await requireSession(["STAFF"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const body = await req.json();
  const bankAccountHolder = String(body.bankAccountHolder || "").trim();
  const bankName = String(body.bankName || "").trim();
  const accountNumber = String(body.accountNumber || "").trim();
  const ifscCode = String(body.ifscCode || "")
    .trim()
    .toUpperCase();
  const branchName = String(body.branchName || "").trim();

  if (!bankAccountHolder || !bankName || !accountNumber || !ifscCode) {
    return NextResponse.json(
      {
        error:
          "Account holder, bank name, account number and IFSC are required",
      },
      { status: 400 }
    );
  }

  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
    return NextResponse.json(
      { error: "Enter a valid IFSC code" },
      { status: 400 }
    );
  }

  const profile = await prisma.staffProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      bankAccountHolder,
      bankName,
      accountNumber,
      ifscCode,
      branchName: branchName || null,
    },
    update: {
      bankAccountHolder,
      bankName,
      accountNumber,
      ifscCode,
      branchName: branchName || null,
    },
  });

  return NextResponse.json({
    bank: {
      bankAccountHolder: profile.bankAccountHolder || "",
      bankName: profile.bankName || "",
      accountNumber: profile.accountNumber || "",
      ifscCode: profile.ifscCode || "",
      branchName: profile.branchName || "",
    },
  });
}
