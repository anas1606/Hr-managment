"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { ClipboardPlus, Download } from "lucide-react";
import { formatDateOnly, formatHours, formatTime } from "@/lib/utils";

type StaffOption = { id: string; name: string };
type RecordRow = {
  id: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  user: {
    name: string;
    username: string;
    staffProfile?: { employeeId?: string | null; department?: string | null } | null;
  };
};

export function AttendanceReport() {
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [manualUserId, setManualUserId] = useState("");
  const [manualDate, setManualDate] = useState(
    () => format(new Date(), "yyyy-MM-dd")
  );
  const [manualCheckIn, setManualCheckIn] = useState("10:00");
  const [manualCheckOut, setManualCheckOut] = useState("19:00");
  const [manualBusy, setManualBusy] = useState(false);
  const [manualMsg, setManualMsg] = useState("");
  const [manualError, setManualError] = useState("");

  useEffect(() => {
    fetch("/api/staff")
      .then((r) => r.json())
      .then((json) =>
        setStaff(
          (json.staff || []).map((s: { id: string; name: string }) => ({
            id: s.id,
            name: s.name,
          }))
        )
      );
  }, []);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/attendance?${params.toString()}`);
    const json = await res.json();
    setRecords(json.records || []);
  }, [userId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  function exportCsv() {
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("format", "csv");
    window.location.href = `/api/attendance?${params.toString()}`;
  }

  async function pushManualAttendance(e: FormEvent) {
    e.preventDefault();
    setManualBusy(true);
    setManualMsg("");
    setManualError("");
    const res = await fetch("/api/attendance/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: manualUserId,
        date: manualDate,
        checkInTime: manualCheckIn,
        checkOutTime: manualCheckOut || undefined,
      }),
    });
    const json = await res.json();
    setManualBusy(false);
    if (!res.ok) {
      setManualError(json.error || "Failed to save attendance");
      return;
    }
    setManualMsg(
      `Attendance saved for ${json.record?.user?.name || "staff"} on ${manualDate}`
    );
    load();
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Attendance report
          </h1>
          <p className="mt-1 text-sm text-subtext">
            Filter by staff and date range, or push attendance manually
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <form
        onSubmit={pushManualAttendance}
        className="liquid-glass grid grid-cols-1 gap-3 rounded-[24px] p-4 sm:rounded-[28px] sm:p-5 md:grid-cols-2 lg:grid-cols-5"
      >
        <div className="flex items-center gap-2 md:col-span-2 lg:col-span-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft-blue text-primary">
            <ClipboardPlus className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Manual attendance</p>
            <p className="text-xs text-subtext">
              Admin-only — creates or updates the record for that staff & date
            </p>
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-subtext">
            Staff
          </span>
          <select
            required
            value={manualUserId}
            onChange={(e) => setManualUserId(e.target.value)}
            className="field-input"
          >
            <option value="">Select staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-subtext">
            Date
          </span>
          <input
            type="date"
            required
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            className="field-input"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-subtext">
            Check in
          </span>
          <input
            type="time"
            required
            value={manualCheckIn}
            onChange={(e) => setManualCheckIn(e.target.value)}
            className="field-input"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-subtext">
            Check out (optional)
          </span>
          <input
            type="time"
            value={manualCheckOut}
            onChange={(e) => setManualCheckOut(e.target.value)}
            className="field-input"
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={manualBusy}
            className="w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {manualBusy ? "Saving..." : "Push attendance"}
          </button>
        </div>

        {manualError ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger md:col-span-2 lg:col-span-5">
            {manualError}
          </p>
        ) : null}
        {manualMsg ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 md:col-span-2 lg:col-span-5">
            {manualMsg}
          </p>
        ) : null}
      </form>

      <div className="liquid-glass grid grid-cols-1 gap-3 rounded-[24px] p-4 sm:rounded-[28px] sm:p-5 md:grid-cols-4">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="field-input"
        >
          <option value="">All staff</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="field-input"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="field-input"
        />
        <button
          onClick={load}
          className="rounded-2xl border border-primary/30 bg-soft-blue px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
        >
          Apply filters
        </button>
      </div>

      <div className="liquid-glass overflow-hidden rounded-[24px] sm:rounded-[28px]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-white/60 bg-soft-blue-2/70 text-left text-xs uppercase tracking-wide text-subtext">
                <th className="px-4 py-3.5 font-semibold">Date</th>
                <th className="px-4 py-3.5 font-semibold">Staff</th>
                <th className="px-4 py-3.5 font-semibold">Employee ID</th>
                <th className="px-4 py-3.5 font-semibold">Check In</th>
                <th className="px-4 py-3.5 font-semibold">Check Out</th>
                <th className="px-4 py-3.5 font-semibold">Total Hrs</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-white/50 transition hover:bg-white/40"
                >
                  <td className="px-4 py-3.5">
                    {formatDateOnly(r.date)}
                  </td>
                  <td className="px-4 py-3.5 font-medium">{r.user.name}</td>
                  <td className="px-4 py-3.5 text-subtext">
                    {r.user.staffProfile?.employeeId || "—"}
                  </td>
                  <td className="px-4 py-3.5">{formatTime(r.checkInAt)}</td>
                  <td className="px-4 py-3.5">{formatTime(r.checkOutAt)}</td>
                  <td className="px-4 py-3.5 font-medium">
                    {formatHours(r.checkInAt, r.checkOutAt)}
                  </td>
                </tr>
              ))}
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-subtext"
                  >
                    No records found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
