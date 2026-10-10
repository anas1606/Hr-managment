"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";

type Leave = {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string | null;
  user: { name: string; username: string };
};

export function LeavesManager() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const params = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/leaves${params}`);
    const json = await res.json();
    setLeaves(json.leaves || []);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(id: string, status: "APPROVED" | "REJECTED") {
    await fetch(`/api/leaves/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote: notes[id] || "" }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Leave approvals</h1>
          <p className="text-sm text-subtext">Review staff leave requests</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-2xl border border-border px-3 py-2.5 bg-white"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      <div className="space-y-3">
        {leaves.map((leave) => (
          <div
            key={leave.id}
            className="bg-white rounded-[24px] card-shadow p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{leave.user.name}</p>
                <p className="text-sm text-subtext">@{leave.user.username}</p>
                <p className="mt-2 text-sm">
                  {format(new Date(leave.fromDate), "MMM d")} –{" "}
                  {format(new Date(leave.toDate), "MMM d, yyyy")}
                </p>
                <p className="text-sm text-subtext mt-1">{leave.reason}</p>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  leave.status === "PENDING"
                    ? "bg-soft-blue text-primary"
                    : leave.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-danger"
                }`}
              >
                {leave.status}
              </span>
            </div>

            {leave.status === "PENDING" ? (
              <div className="mt-4 space-y-3">
                <input
                  value={notes[leave.id] || ""}
                  onChange={(e) =>
                    setNotes((n) => ({ ...n, [leave.id]: e.target.value }))
                  }
                  placeholder="Optional admin note"
                  className="w-full rounded-2xl border border-border px-3 py-2.5 bg-soft-blue-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => decide(leave.id, "APPROVED")}
                    className="rounded-2xl bg-primary text-white px-4 py-2 text-sm font-medium"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(leave.id, "REJECTED")}
                    className="rounded-2xl bg-danger text-white px-4 py-2 text-sm font-medium"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : leave.adminNote ? (
              <p className="mt-3 text-sm text-primary">
                Note: {leave.adminNote}
              </p>
            ) : null}
          </div>
        ))}
        {leaves.length === 0 ? (
          <p className="text-sm text-subtext">No leave requests.</p>
        ) : null}
      </div>
    </div>
  );
}
