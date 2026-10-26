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
} from "lucide-react";
import Link from "next/link";
import {
  breakSeconds,
  cn,
  formatDateOnly,
  formatDuration,
  formatHours,
  formatOverallHours,
  formatTime,
} from "@/lib/utils";

type BreakRecord = {
  id: string;
  startAt: string;
  endAt: string | null;
};

type Attendance = {
  id: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  breaks?: BreakRecord[];
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
    <div className="fade-up flex min-h-0 flex-1 flex-col gap-3 bg-transparent md:h-full md:gap-4">
      {/* Header */}
      <div className="liquid-glass flex shrink-0 flex-col gap-3 rounded-[22px] px-4 py-3 sm:rounded-[26px] sm:px-5 sm:py-3.5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan text-white shadow-md shadow-primary/25">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-lg font-semibold tracking-tight sm:text-xl">
              Attendance calendar
            </h1>
            <p className="text-xs text-subtext">History, holidays & day offs</p>
          </div>
        </div>
        <Link
          href="/staff/leaves"
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 md:w-auto"
        >
          <Plane className="h-4 w-4" />
          Request day off
        </Link>
      </div>

      {/* Month summary chips */}
      <div className="grid shrink-0 grid-cols-3 gap-2">
        <SummaryChip label="Present" value={String(presentCount)} tone="primary" />
        <SummaryChip label="Holidays" value={String(holidays.length)} tone="cyan" />
        <SummaryChip label="Day offs" value={String(leaveCount)} tone="amber" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 md:overflow-hidden lg:gap-4">
        <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[1.35fr_0.95fr] lg:overflow-hidden lg:gap-4">
          {/* Calendar */}
          <section className="liquid-glass rounded-[24px] p-4 sm:rounded-[28px] sm:p-5 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden">
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setMonth((m) => subMonths(m, 1))}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-subtext transition hover:bg-soft-blue hover:text-primary"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="font-heading text-base font-semibold tracking-tight sm:text-lg">
                {format(month, "MMMM yyyy")}
              </h2>
              <button
                type="button"
                onClick={() => setMonth((m) => addMonths(m, 1))}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-subtext transition hover:bg-soft-blue hover:text-primary"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-subtext">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={`${d}-${i}`} className="py-1.5">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid w-full grid-cols-7 gap-1 sm:gap-1.5 lg:min-h-0 lg:flex-1 lg:grid-rows-6">
              {days.map((day) => {
                const { attendance, holiday, leave } = dayMeta(day);
                const inMonth = isSameMonth(day, month);
                const selectedDay = isSameDay(day, selected);
                const today = isToday(day);
                const status = holiday
                  ? "holiday"
                  : leave?.status === "APPROVED"
                    ? "dayoff"
                    : leave?.status === "PENDING"
                      ? "pending"
                      : attendance
                        ? "present"
                        : null;

                return (
                  <button
                    type="button"
                    key={day.toISOString()}
                    onClick={() => setSelected(day)}
                    className={cn(
                      "relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-full text-sm transition lg:aspect-auto lg:h-auto lg:min-h-0",
                      !inMonth && "text-subtext/35",
                      inMonth &&
                        !selectedDay &&
                        "text-foreground hover:bg-soft-blue/70",
                      selectedDay && "bg-primary font-semibold text-white",
                      !selectedDay &&
                        today &&
                        "font-semibold text-primary ring-1 ring-primary/30"
                    )}
                    title={
                      holiday?.name ||
                      (leave ? `Day off: ${leave.status}` : "") ||
                      (attendance ? "Present" : "")
                    }
                  >
                    <span className="leading-none">{format(day, "d")}</span>
                    {status && !selectedDay ? (
                      <span
                        className={cn(
                          "absolute bottom-1 h-1 w-1 rounded-full sm:bottom-1.5",
                          status === "present" && "bg-primary",
                          status === "holiday" && "bg-cyan",
                          status === "dayoff" && "bg-amber-500",
                          status === "pending" && "bg-primary/50"
                        )}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-subtext">
              <Legend color="bg-primary" label="Present" />
              <Legend color="bg-cyan" label="Holiday" />
              <Legend color="bg-amber-500" label="Day off" />
            </div>
          </section>

          {/* Selected day */}
          <div className="flex flex-col gap-3 lg:h-full lg:min-h-0 lg:overflow-hidden">
            <section className="liquid-glass rounded-[24px] p-4 sm:rounded-[28px] sm:p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              <h3 className="font-heading text-base font-semibold tracking-tight">
                {format(selected, "EEEE, MMM d")}
              </h3>

              <div className="mt-4 divide-y divide-border/60">
                {selectedMeta.holiday ? (
                  <InfoRow
                    label="Holiday"
                    value={selectedMeta.holiday.name}
                    tone="cyan"
                  />
                ) : null}
                {selectedMeta.leave ? (
                  <InfoRow
                    label="Day off"
                    value={selectedMeta.leave.status}
                    tone="amber"
                  />
                ) : null}
                {selectedMeta.attendance ? (
                  <DayAttendanceDetails row={selectedMeta.attendance} />
                ) : !selectedMeta.holiday && !selectedMeta.leave ? (
                  <p className="py-6 text-center text-sm text-subtext">
                    No attendance recorded for this day
                  </p>
                ) : null}
              </div>
            </section>

            {holidays.length > 0 ? (
              <section className="liquid-glass shrink-0 overflow-y-auto rounded-[24px] p-4 sm:rounded-[28px] sm:p-5">
                <h3 className="font-heading font-semibold">Holidays</h3>
                <ul className="mt-3 space-y-2">
                  {holidays.map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between rounded-2xl border border-white/50 bg-white/40 px-3 py-2.5 text-sm"
                    >
                      <span className="font-medium">{h.name}</span>
                      <span className="text-subtext">
                        {formatDateOnly(h.date, "MMM d")}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>

        {/* This month — cards on mobile, table on desktop */}
        <section className="liquid-glass rounded-[24px] p-3 sm:rounded-[28px] sm:p-4 lg:max-h-[38vh] lg:overflow-hidden">
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <h3 className="font-heading font-semibold">This month</h3>
            <span className="text-xs text-subtext">
              {loading ? "Loading..." : `${history.length} records`}
            </span>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2.5 md:hidden">
            {!loading && history.length === 0 ? (
              <p className="py-6 text-center text-sm text-subtext">
                No attendance this month.
              </p>
            ) : (
              history.map((row) => {
                const d = new Date(row.date);
                const active = isSameDay(d, selected);
                const breaks = row.breaks || [];
                const breakSecs = breakSeconds(
                  breaks,
                  row.checkOutAt ? new Date(row.checkOutAt) : new Date()
                );
                const breakOverHour = breakSecs > 3600;

                return (
                  <button
                    type="button"
                    key={row.id}
                    onClick={() => setSelected(d)}
                    className={cn(
                      "w-full cursor-pointer rounded-2xl border px-3 py-3 text-left transition",
                      active
                        ? "border-primary/30 bg-soft-blue"
                        : "border-white/60 bg-white/55"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-semibold">
                        {format(d, "MMM d, yyyy")}
                        <span className="ml-1 text-xs font-normal text-subtext">
                          {format(d, "EEE")}
                        </span>
                      </p>
                      <p className="text-xs font-semibold text-primary">
                        {formatHours(row.checkInAt, row.checkOutAt, breaks)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <MobileStat label="Check In" value={formatTime(row.checkInAt)} />
                      <MobileStat label="Check Out" value={formatTime(row.checkOutAt)} />
                      <MobileStat
                        label="Working"
                        value={formatHours(row.checkInAt, row.checkOutAt, breaks)}
                      />
                      <MobileStat
                        label="Overall"
                        value={formatOverallHours(row.checkInAt, row.checkOutAt)}
                      />
                    </div>
                    {breaks.length > 0 ? (
                      <div
                        className={cn(
                          "mt-2 rounded-xl px-2.5 py-2",
                          breakOverHour ? "bg-red-50" : "bg-amber-50/80"
                        )}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "text-[10px] font-semibold uppercase",
                              breakOverHour ? "text-danger" : "text-amber-700"
                            )}
                          >
                            Breaks ({breaks.length})
                          </p>
                          <p
                            className={cn(
                              "text-xs font-semibold",
                              breakOverHour ? "text-danger" : "text-amber-800"
                            )}
                          >
                            {formatDuration(breakSecs)}
                            {breakOverHour ? " · over 1h" : ""}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {breaks.map((b, i) => (
                            <div
                              key={b.id}
                              className={cn(
                                "flex justify-between text-[11px]",
                                breakOverHour ? "text-danger" : "text-foreground"
                              )}
                            >
                              <span>#{i + 1}</span>
                              <span className="font-medium tabular-nums">
                                {formatTime(b.startAt)} –{" "}
                                {b.endAt ? formatTime(b.endAt) : "Ongoing"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-white/60 bg-white/50 md:block lg:max-h-[calc(38vh-3.5rem)] lg:overflow-y-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-soft-blue-2/95 text-[11px] uppercase tracking-wide text-subtext backdrop-blur-sm">
                <tr>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Check In</th>
                  <th className="px-3 py-3 font-semibold">Break In</th>
                  <th className="px-3 py-3 font-semibold">Break Out</th>
                  <th className="px-3 py-3 font-semibold">Break Total</th>
                  <th className="px-3 py-3 font-semibold">Check Out</th>
                  <th className="px-3 py-3 font-semibold">Working Hrs</th>
                  <th className="px-3 py-3 font-semibold">Overall Hrs</th>
                </tr>
              </thead>
              <tbody>
                {!loading && history.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-subtext"
                    >
                      No attendance this month.
                    </td>
                  </tr>
                ) : (
                  history.map((row) => {
                    const d = new Date(row.date);
                    const active = isSameDay(d, selected);
                    const breaks = row.breaks || [];
                    const breakSecs = breakSeconds(
                      breaks,
                      row.checkOutAt ? new Date(row.checkOutAt) : new Date()
                    );
                    const breakOverHour = breakSecs > 3600;
                    const rowSpan = Math.max(breaks.length, 1);

                    if (breaks.length === 0) {
                      return (
                        <tr
                          key={row.id}
                          onClick={() => setSelected(d)}
                          className={cn(
                            "cursor-pointer border-t border-border/70 transition",
                            active ? "bg-soft-blue/80" : "hover:bg-white/80"
                          )}
                        >
                          <td className="px-3 py-3 font-semibold whitespace-nowrap">
                            {format(d, "MMM d, yyyy")}
                            <span className="ml-1 text-xs font-normal text-subtext">
                              {format(d, "EEE")}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {formatTime(row.checkInAt)}
                          </td>
                          <td className="px-3 py-3 text-subtext">—</td>
                          <td className="px-3 py-3 text-subtext">—</td>
                          <td className="px-3 py-3 text-subtext">—</td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {formatTime(row.checkOutAt)}
                          </td>
                          <td className="px-3 py-3 font-semibold whitespace-nowrap">
                            {formatHours(
                              row.checkInAt,
                              row.checkOutAt,
                              breaks
                            )}
                          </td>
                          <td className="px-3 py-3 font-semibold whitespace-nowrap">
                            {formatOverallHours(row.checkInAt, row.checkOutAt)}
                          </td>
                        </tr>
                      );
                    }

                    return breaks.map((b, i) => (
                      <tr
                        key={`${row.id}-${b.id}`}
                        onClick={() => setSelected(d)}
                        className={cn(
                          "cursor-pointer border-t border-border/70 transition",
                          active ? "bg-soft-blue/80" : "hover:bg-white/80",
                          breakOverHour && "bg-red-50/50"
                        )}
                      >
                        {i === 0 ? (
                          <>
                            <td
                              rowSpan={rowSpan}
                              className="px-3 py-3 align-top font-semibold whitespace-nowrap"
                            >
                              {format(d, "MMM d, yyyy")}
                              <span className="ml-1 text-xs font-normal text-subtext">
                                {format(d, "EEE")}
                              </span>
                            </td>
                            <td
                              rowSpan={rowSpan}
                              className="px-3 py-3 align-top whitespace-nowrap"
                            >
                              {formatTime(row.checkInAt)}
                            </td>
                          </>
                        ) : null}
                        <td
                          className={cn(
                            "px-3 py-3 whitespace-nowrap",
                            breakOverHour && "font-medium text-danger"
                          )}
                        >
                          <span className="mr-1 text-[10px] text-subtext">
                            #{i + 1}
                          </span>
                          {formatTime(b.startAt)}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-3 whitespace-nowrap",
                            breakOverHour && "font-medium text-danger"
                          )}
                        >
                          {b.endAt ? formatTime(b.endAt) : "Ongoing"}
                        </td>
                        {i === 0 ? (
                          <>
                            <td
                              rowSpan={rowSpan}
                              className={cn(
                                "px-3 py-3 align-top font-semibold whitespace-nowrap",
                                breakOverHour && "text-danger"
                              )}
                            >
                              {formatDuration(breakSecs)}
                              {breakOverHour ? (
                                <span className="mt-0.5 block text-[10px] font-medium">
                                  Over 1h
                                </span>
                              ) : null}
                            </td>
                            <td
                              rowSpan={rowSpan}
                              className="px-3 py-3 align-top whitespace-nowrap"
                            >
                              {formatTime(row.checkOutAt)}
                            </td>
                            <td
                              rowSpan={rowSpan}
                              className="px-3 py-3 align-top font-semibold whitespace-nowrap"
                            >
                              {formatHours(
                                row.checkInAt,
                                row.checkOutAt,
                                breaks
                              )}
                            </td>
                            <td
                              rowSpan={rowSpan}
                              className="px-3 py-3 align-top font-semibold whitespace-nowrap"
                            >
                              {formatOverallHours(
                                row.checkInAt,
                                row.checkOutAt
                              )}
                            </td>
                          </>
                        ) : null}
                      </tr>
                    ));
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function MobileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/70 px-2.5 py-2">
      <p className="text-[10px] text-subtext">{label}</p>
      <p className="mt-0.5 text-xs font-semibold">{value}</p>
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
  valueClassName,
}: {
  label: string;
  value: string;
  tone: "primary" | "cyan" | "amber" | "danger";
  valueClassName?: string;
}) {
  const valueTone = {
    primary: "text-foreground",
    cyan: "text-foreground",
    amber: "text-amber-800",
    danger: "text-danger",
  }[tone];

  return (
    <div className="flex items-center justify-between px-1 py-2.5 text-sm">
      <span className="text-subtext">{label}</span>
      <span className={cn("font-semibold", valueTone, valueClassName)}>
        {value}
      </span>
    </div>
  );
}

function DayAttendanceDetails({ row }: { row: Attendance }) {
  const breaks = row.breaks || [];
  const breakSecs = breakSeconds(
    breaks,
    row.checkOutAt ? new Date(row.checkOutAt) : new Date()
  );
  const breakOverHour = breakSecs > 3600;

  return (
    <>
      <InfoRow
        label="Check In"
        value={formatTime(row.checkInAt)}
        tone="primary"
      />
      {breaks.map((b, i) => (
        <InfoRow
          key={b.id}
          label={`Break ${i + 1}`}
          value={`${formatTime(b.startAt)} – ${
            b.endAt ? formatTime(b.endAt) : "Ongoing"
          }`}
          tone={breakOverHour ? "danger" : "amber"}
          valueClassName={breakOverHour ? "text-danger" : undefined}
        />
      ))}
      {breaks.length > 0 ? (
        <InfoRow
          label="Break total"
          value={formatDuration(breakSecs)}
          tone={breakOverHour ? "danger" : "amber"}
          valueClassName={breakOverHour ? "text-danger" : undefined}
        />
      ) : null}
      <InfoRow
        label="Check Out"
        value={formatTime(row.checkOutAt)}
        tone="danger"
      />
      <InfoRow
        label="Working hrs"
        value={formatHours(row.checkInAt, row.checkOutAt, breaks)}
        tone="cyan"
      />
      <InfoRow
        label="Overall hrs"
        value={formatOverallHours(row.checkInAt, row.checkOutAt)}
        tone="primary"
      />
    </>
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
