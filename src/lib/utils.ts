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

export function formatHours(
  checkInAt: Date | string | null | undefined,
  checkOutAt: Date | string | null | undefined
): string {
  if (!checkInAt || !checkOutAt) return "--";
  const start = typeof checkInAt === "string" ? new Date(checkInAt) : checkInAt;
  const end =
    typeof checkOutAt === "string" ? new Date(checkOutAt) : checkOutAt;
  const totalSeconds = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 1000)
  );
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
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
