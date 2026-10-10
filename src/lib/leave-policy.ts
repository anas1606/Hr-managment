import { differenceInCalendarDays, endOfYear, startOfYear } from "date-fns";
import { LeaveType, PrismaClient } from "@prisma/client";

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  PL: "Paid Leave",
  GL: "General Leave",
  SL: "Sick Leave",
};

export type LeavePolicyConfig = {
  plPerMonth: number;
  plPerYear: number;
  yearEndMonth: number;
};

export const DEFAULT_LEAVE_POLICY: LeavePolicyConfig = {
  plPerMonth: 1.5,
  plPerYear: 18,
  yearEndMonth: 12,
};

export function leaveDays(fromDate: Date, toDate: Date): number {
  return differenceInCalendarDays(toDate, fromDate) + 1;
}

export async function getLeavePolicy(
  prisma: PrismaClient
): Promise<LeavePolicyConfig> {
  // Stale Prisma clients (hot reload before generate) may miss leavePolicy
  const leavePolicy = (
    prisma as PrismaClient & {
      leavePolicy?: PrismaClient["leavePolicy"];
    }
  ).leavePolicy;

  if (!leavePolicy) {
    return { ...DEFAULT_LEAVE_POLICY };
  }

  const policy = await leavePolicy.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      ...DEFAULT_LEAVE_POLICY,
    },
  });

  return {
    plPerMonth: policy.plPerMonth,
    plPerYear: policy.plPerYear,
    yearEndMonth: policy.yearEndMonth,
  };
}

/**
 * PL accrues monthly (e.g. 1.5/mo → 18/yr).
 * Unused PL carries within the calendar year, then stalls at year end (no next-year carry).
 */
export function accruedPlDays(
  policy: LeavePolicyConfig,
  joinedAt: Date,
  asOf: Date = new Date()
): number {
  const year = asOf.getFullYear();
  const yearStart = startOfYear(asOf);
  const yearEnd = endOfYear(asOf);

  if (joinedAt > yearEnd) return 0;

  const accrualStart = joinedAt > yearStart ? joinedAt : yearStart;
  const startMonth = accrualStart.getMonth() + 1; // 1–12
  const asOfMonth = asOf.getMonth() + 1;
  const lastAccrualMonth = Math.min(asOfMonth, policy.yearEndMonth);

  if (lastAccrualMonth < startMonth) return 0;

  const monthsAccrued = lastAccrualMonth - startMonth + 1;
  return Math.min(monthsAccrued * policy.plPerMonth, policy.plPerYear);
}

export async function getPlBalance(
  prisma: PrismaClient,
  userId: string,
  asOf: Date = new Date()
) {
  const [policy, user] = await Promise.all([
    getLeavePolicy(prisma),
    prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    }),
  ]);

  if (!user) {
    return null;
  }

  const year = asOf.getFullYear();
  const from = startOfYear(asOf);
  const to = endOfYear(asOf);

  const plLeaves = await prisma.leaveRequest.findMany({
    where: {
      userId,
      type: "PL",
      status: { in: ["APPROVED", "PENDING"] },
      fromDate: { lte: to },
      toDate: { gte: from },
    },
    select: {
      fromDate: true,
      toDate: true,
      status: true,
    },
  });

  let used = 0;
  let pending = 0;

  for (const leave of plLeaves) {
    // Count only days that fall in the current calendar year
    const start = leave.fromDate < from ? from : leave.fromDate;
    const end = leave.toDate > to ? to : leave.toDate;
    const days = leaveDays(start, end);
    if (leave.status === "APPROVED") used += days;
    else pending += days;
  }

  const accrued = accruedPlDays(policy, user.createdAt, asOf);
  const available = Math.max(0, Number((accrued - used - pending).toFixed(2)));

  return {
    year,
    policy,
    accrued: Number(accrued.toFixed(2)),
    used: Number(used.toFixed(2)),
    pending: Number(pending.toFixed(2)),
    available,
    note: "Unused PL carries month to month within the year, then stalls at December (no carry to next year).",
  };
}
