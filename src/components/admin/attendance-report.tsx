"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Attendance report</h1>
          <p className="text-sm text-subtext">Filter by staff and date range</p>
        </div>
        <button
          onClick={exportCsv}
          className="rounded-2xl bg-primary text-white px-4 py-2.5 text-sm font-medium"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-[28px] card-shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="rounded-2xl border border-border px-3 py-2.5 bg-soft-blue-2"
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
          className="rounded-2xl border border-border px-3 py-2.5 bg-soft-blue-2"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-2xl border border-border px-3 py-2.5 bg-soft-blue-2"
        />
        <button
          onClick={load}
          className="rounded-2xl border border-primary text-primary font-medium"
        >
          Apply
        </button>
      </div>

      <div className="bg-white rounded-[28px] card-shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-soft-blue-2 text-left">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Employee ID</th>
              <th className="px-4 py-3">Check In</th>
              <th className="px-4 py-3">Check Out</th>
              <th className="px-4 py-3">Total Hrs</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">
                  {format(new Date(r.date), "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3 font-medium">{r.user.name}</td>
                <td className="px-4 py-3">
                  {r.user.staffProfile?.employeeId || "—"}
                </td>
                <td className="px-4 py-3">{formatTime(r.checkInAt)}</td>
                <td className="px-4 py-3">{formatTime(r.checkOutAt)}</td>
                <td className="px-4 py-3">
                  {formatHours(r.checkInAt, r.checkOutAt)}
                </td>
              </tr>
            ))}
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-subtext">
                  No records found
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
