import { format } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** App timezone — India Standard Time */
export const APP_TZ = "Asia/Kolkata";

/** Today's calendar date in IST as yyyy-MM-dd */
export function todayYmdIST(now = new Date()): string {
  return formatInTimeZone(now, APP_TZ, "yyyy-MM-dd");
}

/**
 * Convert a calendar date (yyyy-MM-dd or Date) to a Prisma-safe @db.Date value.
 * Uses UTC noon so the calendar day does not shift across timezones.
 */
export function toDateOnly(value: string | Date): Date {
  const ymd =
    typeof value === "string"
      ? value.slice(0, 10)
      : formatInTimeZone(value, APP_TZ, "yyyy-MM-dd");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    throw new Error("Invalid date");
  }

  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/** Today's calendar date in IST (for attendance / leaves). */
export function todayDate(now = new Date()): Date {
  return toDateOnly(todayYmdIST(now));
}

/**
 * Build an absolute Date from an IST wall-clock date + time.
 * Example: ("2026-10-12", "10:00") → 2026-10-12 10:00 IST.
 */
export function istDateTime(dateStr: string, timeStr: string): Date {
  const date = dateStr.slice(0, 10);
  const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return fromZonedTime(`${date}T${time}`, APP_TZ);
}

/** Format a DATE column for display (calendar day, no TZ shift). */
export function formatDateOnly(
  value: Date | string | null | undefined,
  pattern = "MMM d, yyyy"
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  // Stored as UTC noon / midnight of the calendar day — read UTC parts.
  return formatInTimeZone(date, "UTC", pattern);
}

export function formatTime(value: Date | string | null | undefined): string {
  if (!value) return "--:--";
  const date = typeof value === "string" ? new Date(value) : value;
  return formatInTimeZone(date, APP_TZ, "hh:mm a");
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

type BreakLike = {
  startAt: Date | string;
  endAt?: Date | string | null;
};

export function breakSeconds(
  breaks: BreakLike[] | null | undefined,
  until: Date = new Date()
): number {
  if (!breaks?.length) return 0;
  return breaks.reduce((sum, b) => {
    const start = typeof b.startAt === "string" ? new Date(b.startAt) : b.startAt;
    const end = b.endAt
      ? typeof b.endAt === "string"
        ? new Date(b.endAt)
        : b.endAt
      : until;
    return sum + Math.max(0, (end.getTime() - start.getTime()) / 1000);
  }, 0);
}

export function overallSeconds(
  checkInAt: Date | string | null | undefined,
  checkOutAt: Date | string | null | undefined
): number | null {
  if (!checkInAt || !checkOutAt) return null;
  const start = typeof checkInAt === "string" ? new Date(checkInAt) : checkInAt;
  const end =
    typeof checkOutAt === "string" ? new Date(checkOutAt) : checkOutAt;
  return Math.max(0, (end.getTime() - start.getTime()) / 1000);
}

export function workedSeconds(
  checkInAt: Date | string | null | undefined,
  checkOutAt: Date | string | null | undefined,
  breaks?: BreakLike[] | null
): number | null {
  const overall = overallSeconds(checkInAt, checkOutAt);
  if (overall == null) return null;
  const end =
    typeof checkOutAt === "string" ? new Date(checkOutAt!) : (checkOutAt as Date);
  return Math.max(0, overall - breakSeconds(breaks, end));
}

export function formatHours(
  checkInAt: Date | string | null | undefined,
  checkOutAt: Date | string | null | undefined,
  breaks?: BreakLike[] | null
): string {
  const worked = workedSeconds(checkInAt, checkOutAt, breaks);
  if (worked == null) return "--";
  return formatDuration(worked);
}

export function formatOverallHours(
  checkInAt: Date | string | null | undefined,
  checkOutAt: Date | string | null | undefined
): string {
  const overall = overallSeconds(checkInAt, checkOutAt);
  if (overall == null) return "--";
  return formatDuration(overall);
}

export function greetingForNow(date = new Date()): string {
  const hour = Number(formatInTimeZone(date, APP_TZ, "H"));
  if (hour < 12) return "Good morning!";
  if (hour < 17) return "Good afternoon!";
  return "Good evening!";
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** @deprecated prefer formatDateOnly — kept for any leftover imports */
export function formatLocalDate(
  value: Date | string,
  pattern = "MMM d, yyyy"
): string {
  return formatDateOnly(value, pattern);
}

// re-export format for non-date formatting needs
export { format };
