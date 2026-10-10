import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { toDateOnly } from "@/lib/utils";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const { error, status, session } = await requireSession(["ADMIN"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId") || undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const csv = searchParams.get("format") === "csv";

  const records = await prisma.attendance.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: toDateOnly(from) } : {}),
              ...(to ? { lte: toDateOnly(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          staffProfile: { select: { employeeId: true, department: true } },
        },
      },
    },
    orderBy: [{ date: "desc" }, { checkInAt: "desc" }],
  });

  if (csv) {
    const header = [
      "Date",
      "Employee",
      "Username",
      "Employee ID",
      "Department",
      "Check In",
      "Check Out",
      "Total Minutes",
    ];
    const rows = records.map((r) => {
      const minutes =
        r.checkInAt && r.checkOutAt
          ? Math.round(
              (r.checkOutAt.getTime() - r.checkInAt.getTime()) / 60000
            )
          : "";
      return [
        format(r.date, "yyyy-MM-dd"),
        r.user.name,
        r.user.username,
        r.user.staffProfile?.employeeId || "",
        r.user.staffProfile?.department || "",
        r.checkInAt ? format(r.checkInAt, "HH:mm") : "",
        r.checkOutAt ? format(r.checkOutAt, "HH:mm") : "",
        String(minutes),
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",");
    });

    const body = [header.join(","), ...rows].join("\n");
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="attendance-report.csv"',
      },
    });
  }

  return NextResponse.json({ records });
}
