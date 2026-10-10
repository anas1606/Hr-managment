"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { formatHours, formatTime } from "@/lib/utils";

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

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Attendance report
          </h1>
          <p className="mt-1 text-sm text-subtext">
            Filter by staff and date range
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
                    {format(new Date(r.date), "MMM d, yyyy")}
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
