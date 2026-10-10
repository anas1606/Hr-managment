"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plane,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { cn, formatHours, formatTime } from "@/lib/utils";

type Attendance = {
  id: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
};

type Holiday = { id: string; date: string; name: string };
type Leave = {
  id: string;
  fromDate: string;
  toDate: string;
  status: string;
  reason: string;
};

export function CalendarView() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [history, setHistory] = useState<Attendance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Date>(() => new Date());

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/attendance/me?month=${format(month, "yyyy-MM")}`
    );
    const json = await res.json();
    setHistory(json.history || []);
    setHolidays(json.holidays || []);
    setLeaves(json.leaves || []);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  function dayMeta(day: Date) {
    const attendance = history.find((h) => isSameDay(new Date(h.date), day));
    const holiday = holidays.find((h) => isSameDay(new Date(h.date), day));
    const leave = leaves.find((l) => {
      const from = new Date(l.fromDate);
      const to = new Date(l.toDate);
      return day >= startOfDaySafe(from) && day <= startOfDaySafe(to);
    });
    return { attendance, holiday, leave };
  }

  const selectedMeta = dayMeta(selected);
  const presentCount = history.filter((h) => h.checkInAt).length;
  const leaveCount = leaves.filter((l) => l.status === "APPROVED").length;

  return (
    <div className="fade-up flex h-full min-h-0 flex-1 flex-col gap-2.5 bg-transparent sm:gap-3 md:gap-4">
      {/* Header */}
      <div className="liquid-glass flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-[22px] px-4 py-3 sm:rounded-[26px] sm:px-5 sm:py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan text-white shadow-md shadow-primary/25 sm:h-11 sm:w-11">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-semibold tracking-tight sm:text-xl md:text-2xl">
              Attendance calendar
            </h1>
            <p className="text-xs text-subtext sm:text-sm">
              History, holidays & leave days
            </p>
          </div>
        </div>
        <Link
          href="/staff/leaves"
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25"
        >
          <Plane className="h-4 w-4" />
          Request leave
        </Link>
      </div>

      {/* Month summary chips */}
      <div className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3">
        <SummaryChip label="Present" value={String(presentCount)} tone="primary" />
        <SummaryChip label="Holidays" value={String(holidays.length)} tone="cyan" />
        <SummaryChip label="Leaves" value={String(leaveCount)} tone="amber" />
      </div>

      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto bg-transparent md:overflow-hidden lg:grid-cols-[1.4fr_0.95fr] lg:gap-4">
        {/* Calendar */}
        <section className="liquid-glass-strong flex min-h-0 flex-col rounded-[24px] p-3 sm:rounded-[28px] sm:p-4 md:rounded-[32px] md:p-5 lg:h-full lg:overflow-hidden lg:rounded-[32px]">
          <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMonth((m) => subMonths(m, 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/50 text-primary transition hover:bg-white"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="font-heading text-lg font-semibold sm:text-xl">
              {format(month, "MMMM yyyy")}
            </h2>
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/50 text-primary transition hover:bg-white"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-1 grid shrink-0 grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-subtext sm:text-xs">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="py-1.5">
                {d}
              </div>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-1 sm:gap-1.5">
            {days.map((day) => {
              const { attendance, holiday, leave } = dayMeta(day);
              const inMonth = isSameMonth(day, month);
              const selectedDay = isSameDay(day, selected);
              const today = isToday(day);

              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  onClick={() => setSelected(day)}
                  className={cn(
                    "relative flex min-h-0 flex-col items-center justify-center rounded-xl text-sm transition sm:rounded-2xl",
                    !inMonth && "opacity-35",
                    selectedDay
                      ? "bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/30"
                      : today
                        ? "bg-soft-blue text-primary ring-2 ring-primary/25"
                        : holiday
                          ? "bg-cyan/15 text-primary hover:bg-cyan/25"
                          : leave?.status === "APPROVED"
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : leave?.status === "PENDING"
                              ? "bg-soft-blue/80 text-primary hover:bg-soft-blue"
                              : attendance
                                ? "bg-white/70 text-foreground hover:bg-white"
                                : "hover:bg-white/60"
                  )}
                  title={
                    holiday?.name ||
                    (leave ? `Leave: ${leave.status}` : "") ||
                    (attendance ? "Present" : "")
                  }
                >
                  <span className="font-semibold leading-none">
                    {format(day, "d")}
                  </span>
                  <span className="mt-1 flex h-1.5 items-center gap-0.5">
                    {attendance && !selectedDay ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    ) : null}
                    {holiday && !selectedDay ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                    ) : null}
                    {leave && !selectedDay ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    ) : null}
                    {selectedDay && (attendance || holiday || leave) ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex shrink-0 flex-wrap gap-3 border-t border-white/50 pt-3 text-xs text-subtext">
            <Legend color="bg-primary" label="Present" />
            <Legend color="bg-cyan" label="Holiday" />
            <Legend color="bg-amber-500" label="Leave" />
            <Legend color="bg-primary ring-2 ring-primary/30" label="Today" />
          </div>
        </section>

        {/* Selected day + records */}
        <div className="flex min-h-0 flex-col gap-3 bg-transparent lg:h-full lg:overflow-hidden">
          <section className="liquid-glass shrink-0 rounded-[24px] p-4 sm:rounded-[28px] sm:p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-semibold">
                {format(selected, "EEEE, MMM d")}
              </h3>
            </div>

            <div className="mt-3 space-y-2">
              {selectedMeta.holiday ? (
                <InfoRow
                  label="Holiday"
                  value={selectedMeta.holiday.name}
                  tone="cyan"
                />
              ) : null}
              {selectedMeta.leave ? (
                <InfoRow
                  label="Leave"
                  value={selectedMeta.leave.status}
                  tone="amber"
                />
              ) : null}
              {selectedMeta.attendance ? (
                <>
                  <InfoRow
                    label="Check In"
                    value={formatTime(selectedMeta.attendance.checkInAt)}
                    tone="primary"
                  />
                  <InfoRow
                    label="Check Out"
                    value={formatTime(selectedMeta.attendance.checkOutAt)}
                    tone="danger"
                  />
                  <InfoRow
                    label="Total Hrs"
                    value={formatHours(
                      selectedMeta.attendance.checkInAt,
                      selectedMeta.attendance.checkOutAt
                    )}
                    tone="cyan"
                  />
                </>
              ) : !selectedMeta.holiday && !selectedMeta.leave ? (
                <p className="rounded-2xl border border-dashed border-border bg-white/40 px-4 py-5 text-center text-sm text-subtext">
                  No attendance recorded for this day
                </p>
              ) : null}
            </div>
          </section>

          <section className="liquid-glass flex min-h-0 flex-1 flex-col rounded-[24px] p-4 sm:rounded-[28px] sm:p-5 lg:overflow-hidden">
            <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
              <h3 className="font-heading font-semibold">This month</h3>
              <span className="text-xs text-subtext">
                {loading ? "Loading..." : `${history.length} records`}
              </span>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl bg-transparent pr-1">
              {!loading && history.length === 0 ? (
                <p className="py-6 text-center text-sm text-subtext">
                  No attendance this month.
                </p>
              ) : (
                history.map((row) => {
                  const d = new Date(row.date);
                  const active = isSameDay(d, selected);
                  return (
                    <button
                      type="button"
                      key={row.id}
                      onClick={() => setSelected(d)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition",
                        active
                          ? "border-primary/30 bg-soft-blue"
                          : "border-white/50 bg-white/45 hover:bg-white/70"
                      )}
                    >
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan text-white shadow-sm shadow-primary/20">
                        <span className="text-base font-semibold leading-none">
                          {format(d, "d")}
                        </span>
                        <span className="text-[10px] opacity-90">
                          {format(d, "EEE")}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 grid grid-cols-3 gap-1 text-center text-xs sm:text-sm">
                        <div>
                          <p className="text-[10px] text-subtext sm:text-xs">
                            In
                          </p>
                          <p className="font-semibold">
                            {formatTime(row.checkInAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-subtext sm:text-xs">
                            Out
                          </p>
                          <p className="font-semibold">
                            {formatTime(row.checkOutAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-subtext sm:text-xs">
                            Hrs
                          </p>
                          <p className="font-semibold">
                            {formatHours(row.checkInAt, row.checkOutAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {holidays.length > 0 ? (
            <section className="liquid-glass max-h-40 shrink-0 overflow-y-auto rounded-[24px] p-4 sm:rounded-[28px] sm:p-5">
              <h3 className="font-heading font-semibold">Holidays</h3>
              <ul className="mt-3 space-y-2">
                {holidays.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center justify-between rounded-2xl border border-white/50 bg-white/40 px-3 py-2.5 text-sm"
                  >
                    <span className="font-medium">{h.name}</span>
                    <span className="text-subtext">
                      {format(new Date(h.date), "MMM d")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "cyan" | "amber";
}) {
  const textTone = {
    primary: "text-primary",
    cyan: "text-primary",
    amber: "text-amber-700",
  }[tone];

  const glassFill = {
    primary:
      "linear-gradient(145deg,rgba(0,111,199,0.12),rgba(255,255,255,0.55))",
    cyan: "linear-gradient(145deg,rgba(4,190,249,0.16),rgba(255,255,255,0.55))",
    amber: "linear-gradient(145deg,rgba(251,191,36,0.2),rgba(255,255,255,0.55))",
  }[tone];

  return (
    <div
      className={cn(
        "liquid-glass rounded-2xl px-3 py-2.5 text-center sm:rounded-[22px] sm:py-3",
        textTone
      )}
      style={{ ["--glass-fill" as string]: glassFill }}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-0.5 font-heading text-lg font-semibold sm:text-xl md:text-2xl">
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "cyan" | "amber" | "danger";
}) {
  const dot = {
    primary: "bg-primary",
    cyan: "bg-cyan",
    amber: "bg-amber-500",
    danger: "bg-danger",
  }[tone];

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/50 bg-white/45 px-3 py-2.5">
      <span className="inline-flex items-center gap-2 text-sm text-subtext">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        {label}
      </span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label}
    </span>
  );
}

function startOfDaySafe(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
