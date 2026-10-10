"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Settings2 } from "lucide-react";

type LeaveType = "PL" | "GL" | "SL";

type Leave = {
  id: string;
  type: LeaveType;
  fromDate: string;
  toDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string | null;
  user: { name: string; username: string };
};

type Policy = {
  plPerMonth: number;
  plPerYear: number;
  yearEndMonth: number;
};

const TYPE_META: Record<
  LeaveType,
  { label: string; badge: string; payout: boolean }
> = {
  PL: {
    label: "Paid Leave",
    badge: "bg-emerald-50 text-emerald-700",
    payout: true,
  },
  GL: {
    label: "General Leave",
    badge: "bg-soft-blue text-primary",
    payout: false,
  },
  SL: {
    label: "Sick Leave",
    badge: "bg-amber-50 text-amber-800",
    payout: false,
  },
};

export function LeavesManager() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [policy, setPolicy] = useState<Policy>({
    plPerMonth: 1.5,
    plPerYear: 18,
    yearEndMonth: 12,
  });
  const [policySaving, setPolicySaving] = useState(false);
  const [policyMsg, setPolicyMsg] = useState("");

  const load = useCallback(async () => {
    const params = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/leaves${params}`);
    const json = await res.json();
    setLeaves(json.leaves || []);
  }, [filter]);

  const loadPolicy = useCallback(async () => {
    const res = await fetch("/api/admin/leave-policy");
    const json = await res.json();
    if (json.policy) setPolicy(json.policy);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadPolicy();
  }, [loadPolicy]);

  async function decide(id: string, status: "APPROVED" | "REJECTED") {
    await fetch(`/api/leaves/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote: notes[id] || "" }),
    });
    load();
  }

  async function savePolicy(e: FormEvent) {
    e.preventDefault();
    setPolicySaving(true);
    setPolicyMsg("");
    const res = await fetch("/api/admin/leave-policy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(policy),
    });
    const json = await res.json();
    setPolicySaving(false);
    if (!res.ok) {
      setPolicyMsg(json.error || "Could not save policy");
      return;
    }
    setPolicy(json.policy);
    setPolicyMsg("Paid leave policy saved");
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Day off approvals
          </h1>
          <p className="mt-1 text-sm text-subtext">
            Review staff day off requests & configure PL policy
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="field-input w-auto min-w-[140px]"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      <form
        onSubmit={savePolicy}
        className="liquid-glass space-y-4 rounded-[24px] p-4 sm:rounded-[28px] sm:p-5"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-soft-blue text-primary">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold">
              Paid Leave (PL) policy
            </h2>
            <p className="mt-0.5 text-xs text-subtext">
              Accrues each month, unused PL carries within the year, then stalls
              at December (no carry to next year).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-medium text-subtext">
              PL per month
            </span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={policy.plPerMonth}
              onChange={(e) =>
                setPolicy((p) => ({
                  ...p,
                  plPerMonth: Number(e.target.value),
                }))
              }
              className="field-input"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-medium text-subtext">
              PL per year (cap)
            </span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={policy.plPerYear}
              onChange={(e) =>
                setPolicy((p) => ({
                  ...p,
                  plPerYear: Number(e.target.value),
                }))
              }
              className="field-input"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-medium text-subtext">
              Year-end stall month
            </span>
            <select
              value={policy.yearEndMonth}
              onChange={(e) =>
                setPolicy((p) => ({
                  ...p,
                  yearEndMonth: Number(e.target.value),
                }))
              }
              className="field-input"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {format(new Date(2026, m - 1, 1), "MMMM")}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={policySaving}
            className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {policySaving ? "Saving..." : "Save PL policy"}
          </button>
          {policyMsg ? (
            <p className="text-sm text-primary">{policyMsg}</p>
          ) : null}
        </div>
      </form>

      <div className="space-y-3">
        {leaves.map((leave) => (
          <div
            key={leave.id}
            className="liquid-glass rounded-[24px] p-4 sm:rounded-[28px] sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{leave.user.name}</p>
                <p className="text-sm text-subtext">@{leave.user.username}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      TYPE_META[leave.type]?.badge || "bg-soft-blue text-primary"
                    }`}
                  >
                    {leave.type} · {TYPE_META[leave.type]?.label || leave.type}
                  </span>
                  {TYPE_META[leave.type]?.payout ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
                      Payout
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                      Track
                    </span>
                  )}
                  <span className="text-sm font-medium">
                    {format(new Date(leave.fromDate), "MMM d")} –{" "}
                    {format(new Date(leave.toDate), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-subtext">{leave.reason}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
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
                  className="field-input"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => decide(leave.id, "APPROVED")}
                    className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(leave.id, "REJECTED")}
                    className="rounded-2xl bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : leave.adminNote ? (
              <p className="mt-3 rounded-xl bg-soft-blue/60 px-3 py-2 text-sm text-primary">
                Note: {leave.adminNote}
              </p>
            ) : null}
          </div>
        ))}
        {leaves.length === 0 ? (
          <div className="liquid-glass rounded-[24px] px-4 py-10 text-center text-sm text-subtext sm:rounded-[28px]">
            No day off requests.
          </div>
        ) : null}
      </div>
    </div>
  );
}
