"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { CalendarRange, Plane, Send, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type LeaveType = "PL" | "GL" | "SL";

type Leave = {
  id: string;
  type: LeaveType;
  fromDate: string;
  toDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string | null;
};

type PlBalance = {
  year: number;
  accrued: number;
  used: number;
  pending: number;
  available: number;
  policy: { plPerMonth: number; plPerYear: number; yearEndMonth: number };
  note: string;
};

const LEAVE_TYPES: Array<{
  value: LeaveType;
  label: string;
  short: string;
  category: string;
  hint: string;
  payout: boolean;
  activeClass: string;
  badgeClass: string;
}> = [
  {
    value: "PL",
    label: "Paid Leave",
    short: "PL",
    category: "Paid category",
    hint: "Counted for payroll / payout. Uses PL balance.",
    payout: true,
    activeClass: "border-emerald-400/50 bg-emerald-50 shadow-sm",
    badgeClass: "bg-emerald-50 text-emerald-700",
  },
  {
    value: "GL",
    label: "General Leave",
    short: "GL",
    category: "Unpaid category",
    hint: "General day off. Not paid / no PL balance used.",
    payout: false,
    activeClass: "border-primary/40 bg-soft-blue shadow-sm",
    badgeClass: "bg-soft-blue text-primary",
  },
  {
    value: "SL",
    label: "Sick Leave",
    short: "SL",
    category: "Medical category",
    hint: "For illness or medical needs. Tracked separately from PL.",
    payout: false,
    activeClass: "border-amber-400/50 bg-amber-50 shadow-sm",
    badgeClass: "bg-amber-50 text-amber-800",
  },
];

export function LeavesView() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [type, setType] = useState<LeaveType>("PL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [balance, setBalance] = useState<PlBalance | null>(null);

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const [leavesRes, balanceRes] = await Promise.all([
        fetch("/api/leaves"),
        fetch("/api/leaves/balance"),
      ]);
      const leavesJson = leavesRes.ok ? await leavesRes.json() : { leaves: [] };
      const balanceJson = balanceRes.ok
        ? await balanceRes.json()
        : { balance: null };
      setLeaves(leavesJson.leaves || []);
      setBalance(balanceJson.balance || null);
    } catch {
      setLeaves([]);
      setBalance(null);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const dayCount = useMemo(() => {
    if (!fromDate || !toDate) return null;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
      return null;
    }
    return differenceInCalendarDays(to, from) + 1;
  }, [fromDate, toDate]);

  const plAvailable = balance?.available ?? 0;
  const noPlBalance = type === "PL" && plAvailable <= 0;
  const plExceedsBalance =
    type === "PL" &&
    dayCount != null &&
    dayCount > plAvailable;
  const canSubmitPl = type !== "PL" || (!noPlBalance && !plExceedsBalance);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmitPl) {
      setError(
        noPlBalance
          ? "No Paid Leave balance available. Choose GL or SL, or wait for next month’s accrual."
          : `Not enough PL balance. Available ${plAvailable} day(s), requested ${dayCount}.`
      );
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, fromDate, toDate, reason }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Failed to submit");
      if (json.balance) setBalance(json.balance);
      return;
    }
    setFromDate("");
    setToDate("");
    setReason("");
    load();
  }

  return (
    <div className="fade-up flex h-full min-h-0 w-full flex-1 flex-col gap-3 md:gap-4">
      <div className="liquid-glass flex shrink-0 flex-col gap-3 rounded-[22px] px-4 py-3.5 sm:rounded-[26px] sm:px-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan text-white shadow-md shadow-primary/25">
            <Plane className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-lg font-semibold tracking-tight sm:text-xl md:text-2xl">
              Day off requests
            </h1>
            <p className="text-xs text-subtext sm:text-sm">
              Choose leave type and submit for admin approval
            </p>
          </div>
        </div>

        {balance ? (
          <div
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 md:w-auto md:min-w-[340px]",
              plAvailable > 0
                ? "border-emerald-200/80 bg-emerald-50/70"
                : "border-red-200/80 bg-red-50/70"
            )}
          >
            <Wallet
              className={cn(
                "h-4 w-4 shrink-0",
                plAvailable > 0 ? "text-emerald-600" : "text-danger"
              )}
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-xs font-semibold",
                  plAvailable > 0 ? "text-emerald-800" : "text-danger"
                )}
              >
                Available PL
              </p>
              <p
                className={cn(
                  "truncate text-[10px]",
                  plAvailable > 0 ? "text-emerald-700/70" : "text-danger/70"
                )}
              >
                {balance.policy.plPerMonth}/mo · {balance.policy.plPerYear}/yr ·
                carries in {balance.year}
              </p>
            </div>
            <p
              className={cn(
                "font-heading text-xl font-semibold",
                plAvailable > 0 ? "text-emerald-600" : "text-danger"
              )}
            >
              {balance.available}
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1.15fr_0.95fr] lg:gap-4 lg:overflow-hidden">
        <form
          onSubmit={onSubmit}
          className="liquid-glass-strong flex min-h-0 flex-col space-y-4 rounded-[24px] p-4 sm:rounded-[28px] sm:p-5 lg:overflow-y-auto"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-sm font-semibold sm:text-base">
                New request
              </h2>
            </div>
            {dayCount ? (
              <span className="rounded-full bg-soft-blue px-2.5 py-1 text-[11px] font-semibold text-primary">
                {dayCount} day{dayCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-subtext">
              Leave category
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
              {LEAVE_TYPES.map((option) => {
                const active = type === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={cn(
                      "cursor-pointer rounded-2xl border px-3 py-3 text-left transition",
                      active
                        ? option.activeClass
                        : "border-border/70 bg-white/60 hover:bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm font-semibold sm:text-base",
                          active && option.value === "PL" && "text-emerald-700",
                          active && option.value === "GL" && "text-primary",
                          active && option.value === "SL" && "text-amber-800",
                          !active && "text-foreground"
                        )}
                      >
                        {option.short}
                      </p>
                      {option.payout ? (
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                          Payout
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                          Track
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-foreground/80">
                      {option.label}
                    </p>
                    <p className="mt-1 text-[10px] leading-snug text-subtext">
                      {option.category}
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-subtext">
              {LEAVE_TYPES.find((t) => t.value === type)?.hint}
              {type === "PL" && balance ? (
                <>
                  {" · "}
                  <span
                    className={cn(
                      "font-semibold",
                      plAvailable > 0 ? "text-emerald-600" : "text-danger"
                    )}
                  >
                    Available {balance.available} day(s)
                  </span>
                </>
              ) : null}
            </p>
            {noPlBalance ? (
              <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-danger">
                No PL balance left. You cannot submit Paid Leave. Use GL or SL
                instead.
              </p>
            ) : null}
            {plExceedsBalance ? (
              <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-danger">
                Requested {dayCount} day(s) but only {plAvailable} PL day(s)
                available.
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="From">
              <input
                type="date"
                required
                value={fromDate}
                min={today}
                onChange={(e) => {
                  const next = e.target.value;
                  setFromDate(next);
                  if (toDate && toDate < next) setToDate(next);
                }}
                className="field-input"
              />
            </Field>
            <Field label="To">
              <input
                type="date"
                required
                value={toDate}
                min={fromDate || today}
                onChange={(e) => setToDate(e.target.value)}
                className="field-input"
              />
            </Field>
          </div>

          <Field label="Reason">
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="field-input min-h-[120px] resize-none"
              placeholder="Why do you need a day off?"
            />
          </Field>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || !canSubmitPl}
            className="mt-auto flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {loading
              ? "Submitting..."
              : noPlBalance
                ? "No PL balance"
                : plExceedsBalance
                  ? "Not enough PL"
                  : "Send request"}
          </button>
        </form>

        <section className="liquid-glass flex min-h-0 flex-col rounded-[24px] p-4 sm:rounded-[28px] sm:p-5 lg:overflow-hidden">
          <div className="mb-3 flex shrink-0 items-center justify-between px-1">
            <h2 className="font-heading text-sm font-semibold sm:text-base">
              Your requests
            </h2>
            <span className="text-xs text-subtext">
              {fetching ? "Loading..." : `${leaves.length} total`}
            </span>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {!fetching && leaves.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-white/40 px-4 py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-soft-blue text-primary">
                  <Plane className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">No day off requests yet</p>
                <p className="mt-1 text-xs text-subtext">
                  Submit your first request using the form
                </p>
              </div>
            ) : (
              leaves.map((leave) => {
                const days =
                  differenceInCalendarDays(
                    new Date(leave.toDate),
                    new Date(leave.fromDate)
                  ) + 1;
                const typeMeta =
                  LEAVE_TYPES.find((t) => t.value === leave.type) ||
                  LEAVE_TYPES[1];

                return (
                  <article
                    key={leave.id}
                    className="rounded-2xl border border-white/70 bg-white/55 px-4 py-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              typeMeta.badgeClass
                            )}
                          >
                            {typeMeta.short} · {typeMeta.label}
                          </span>
                          {typeMeta.payout ? (
                            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-emerald-700">
                              Payout
                            </span>
                          ) : null}
                          <span className="text-xs text-subtext">
                            {days} day{days === 1 ? "" : "s"}
                          </span>
                        </div>
                        <p className="font-heading text-sm font-semibold tracking-tight sm:text-base">
                          {format(new Date(leave.fromDate), "MMM d")} –{" "}
                          {format(new Date(leave.toDate), "MMM d, yyyy")}
                        </p>
                      </div>
                      <StatusBadge status={leave.status} />
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                      {leave.reason}
                    </p>

                    {leave.adminNote ? (
                      <p className="mt-3 rounded-xl bg-soft-blue/70 px-3 py-2 text-xs text-primary">
                        <span className="font-semibold">Admin note:</span>{" "}
                        {leave.adminNote}
                      </p>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-subtext">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: Leave["status"] }) {
  const styles = {
    PENDING: "bg-soft-blue text-primary",
    APPROVED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-red-50 text-danger",
  };
  const labels = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };

  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}
