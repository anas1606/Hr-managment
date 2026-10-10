import { format, parseISO, startOfDay } from "date-fns";

export function todayDate(): Date {
  return startOfDay(new Date());
}

export function toDateOnly(value: string | Date): Date {
  if (typeof value === "string") {
    return startOfDay(parseISO(value));
  }
  return startOfDay(value);
}

export function formatTime(value: Date | string | null | undefined): string {
  if (!value) return "--:--";
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, "hh:mm a");
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
  const hour = date.getHours();
  if (hour < 12) return "Good morning!";
  if (hour < 17) return "Good afternoon!";
  return "Good evening!";
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
