"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { format } from "date-fns";

type Leave = {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string | null;
};

export function LeavesView() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/leaves");
    const json = await res.json();
    setLeaves(json.leaves || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromDate, toDate, reason }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Failed to submit");
      return;
    }
    setFromDate("");
    setToDate("");
    setReason("");
    load();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Leave requests</h1>
        <p className="text-sm text-subtext">
          Submit a request for admin approval
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-white rounded-[28px] card-shadow p-5 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">From</label>
            <input
              type="date"
              required
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-border px-3 py-2.5 bg-soft-blue-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">To</label>
            <input
              type="date"
              required
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-border px-3 py-2.5 bg-soft-blue-2"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Reason</label>
          <textarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-border px-3 py-2.5 bg-soft-blue-2"
            placeholder="Why do you need leave?"
          />
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-primary text-white px-5 py-2.5 font-medium disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Send request"}
        </button>
      </form>

      <section className="space-y-3">
        {leaves.map((leave) => (
          <div
            key={leave.id}
            className="bg-white rounded-2xl card-shadow px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">
                {format(new Date(leave.fromDate), "MMM d")} –{" "}
                {format(new Date(leave.toDate), "MMM d, yyyy")}
              </p>
              <StatusBadge status={leave.status} />
            </div>
            <p className="text-sm text-subtext mt-1">{leave.reason}</p>
            {leave.adminNote ? (
              <p className="text-xs text-primary mt-2">
                Admin note: {leave.adminNote}
              </p>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: Leave["status"] }) {
  const styles = {
    PENDING: "bg-soft-blue text-primary",
    APPROVED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-red-50 text-danger",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
}
