import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getPlBalance } from "@/lib/leave-policy";

export async function GET() {
  try {
    const { error, status, session } = await requireSession(["STAFF"]);
    if (error || !session) {
      return NextResponse.json({ error }, { status });
    }

    const balance = await getPlBalance(prisma, session.user.id);
    if (!balance) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ balance });
  } catch (err) {
    console.error("GET /api/leaves/balance", err);
    return NextResponse.json(
      { error: "Could not load Paid Leave balance" },
      { status: 500 }
    );
  }
}
