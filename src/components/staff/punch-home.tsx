"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  LogIn,
  LogOut,
  Quote,
  RefreshCw,
  Timer,
  Trash2,
} from "lucide-react";
import { cn, formatHours, formatTime, greetingForNow } from "@/lib/utils";
import {
  backgroundAtIndex,
  dayOfYearIndex,
  quoteAtIndex,
  QUOTE_ROTATE_SECONDS,
} from "@/lib/quotes";

type Attendance = {
  id: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  date: string;
};

export function PunchHome() {
  const { data } = useSession();
  const [now, setNow] = useState(() => new Date());
  const [today, setToday] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState("");
  const [quoteOffset, setQuoteOffset] = useState(0);
  const [quoteKey, setQuoteKey] = useState(0);

  const nextQuote = useCallback(() => {
    setQuoteOffset((o) => o + 1);
    setQuoteKey((k) => k + 1);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/attendance/me");
    const json = await res.json();
    setToday(json.today || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [load]);

  // Auto-rotate quote + background every QUOTE_ROTATE_SECONDS
  useEffect(() => {
    const t = setInterval(nextQuote, QUOTE_ROTATE_SECONDS * 1000);
    return () => clearInterval(t);
  }, [nextQuote, quoteKey]);

  const mode = useMemo(() => {
    if (!today?.checkInAt) return "CHECK_IN" as const;
    if (!today?.checkOutAt) return "CHECK_OUT" as const;
    return "DONE" as const;
  }, [today]);

  const quoteIndex = dayOfYearIndex(now) + quoteOffset;
  const quote = useMemo(() => quoteAtIndex(quoteIndex), [quoteIndex]);

  async function punch() {
    if (mode === "DONE") return;
    setPunching(true);
    setError("");
    const res = await fetch("/api/attendance/punch", { method: "POST" });
    const json = await res.json();
    setPunching(false);
    if (!res.ok) {
      setError(json.error || "Could not punch");
      return;
    }
    setToday(json.record);
  }

  async function deleteTodayPunch() {
    if (!today?.checkInAt) return;
    setDeleting(true);
    setError("");
    const res = await fetch("/api/attendance/punch", { method: "DELETE" });
    const json = await res.json();
    setDeleting(false);
    if (!res.ok) {
      setError(json.error || "Could not delete punch log");
      return;
    }
    setToday(null);
    setShowDeleteModal(false);
  }

  const firstName = data?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="fade-up grid h-full min-h-0 flex-1 grid-cols-2 grid-rows-[auto_1fr_auto] gap-2.5 bg-transparent sm:gap-3 md:grid-cols-12 md:grid-rows-[auto_1fr] md:gap-4">
      {/* Greeting */}
      <div className="liquid-glass col-span-2 flex items-center justify-between gap-3 rounded-[22px] px-4 py-3.5 sm:rounded-[26px] sm:px-5 sm:py-4 md:col-span-8 md:rounded-[28px] md:px-6 md:py-5">
        <div className="min-w-0">
          <h1 className="truncate font-heading text-[1.45rem] font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            Hey {firstName}!
          </h1>
          <p className="mt-0.5 text-[13px] text-subtext sm:mt-1 sm:text-sm">
            {greetingForNow(now)} Mark your attendance
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan font-heading text-base font-semibold text-white shadow-lg shadow-primary/30 sm:h-12 sm:w-12 md:h-14 md:w-14 md:text-lg">
          {firstName.slice(0, 1).toUpperCase()}
        </div>
      </div>

      {/* Quotes — single right section (desktop spans full height) */}
      <QuotesPanel
        quote={quote}
        quoteIndex={quoteIndex}
        quoteKey={quoteKey}
        onNext={nextQuote}
        className="hidden md:col-span-4 md:row-span-2 md:flex"
      />

      {/* Hero punch + clock */}
      <div className="liquid-glass-strong col-span-2 flex min-h-0 flex-col rounded-[24px] p-4 sm:rounded-[28px] sm:p-5 md:col-span-8 md:rounded-[32px] md:p-6">
        <div className="shrink-0 text-center">
          <div className="inline-flex items-baseline justify-center gap-1.5 sm:gap-2">
            <span className="font-heading text-[2.5rem] font-semibold leading-none tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {format(now, "hh:mm")}
            </span>
            <span className="pb-0.5 font-heading text-base font-semibold leading-none text-primary sm:pb-1 sm:text-2xl md:text-3xl">
              {format(now, "a")}
            </span>
          </div>
          <p className="mt-1.5 text-[13px] font-medium text-subtext sm:mt-2 sm:text-sm">
            <span className="sm:hidden">{format(now, "EEE, MMM d, yyyy")}</span>
            <span className="hidden sm:inline">
              {format(now, "EEEE, MMMM d, yyyy")}
            </span>
          </p>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center py-4 sm:py-5">
          <div
            className={cn(
              "rounded-full p-[3px]",
              mode === "DONE"
                ? "bg-gradient-to-br from-primary/40 to-cyan/40"
                : "punch-ring",
              mode !== "DONE" && "pulse-soft"
            )}
          >
            <button
              onClick={punch}
              disabled={punching || loading || mode === "DONE"}
              className={cn(
                "punch-shadow relative flex h-[9.25rem] w-[9.25rem] flex-col items-center justify-center rounded-full border-[6px] border-white/80 transition duration-200 active:scale-[0.97] sm:h-44 sm:w-44 md:h-48 md:w-48 lg:h-52 lg:w-52",
                mode === "CHECK_OUT" &&
                  "bg-gradient-to-b from-white/95 to-red-50/90 text-danger",
                mode === "CHECK_IN" &&
                  "bg-gradient-to-b from-white/95 to-soft-blue/90 text-primary",
                mode === "DONE" &&
                  "cursor-default bg-gradient-to-b from-white/95 to-emerald-50/90 text-success",
                punching && "opacity-80"
              )}
            >
              {mode === "CHECK_OUT" ? (
                <LogOut className="mb-1.5 h-9 w-9 sm:mb-2 sm:h-11 sm:w-11" strokeWidth={2.2} />
              ) : mode === "DONE" ? (
                <CheckCircle2 className="mb-1.5 h-9 w-9 sm:mb-2 sm:h-11 sm:w-11" strokeWidth={2.2} />
              ) : (
                <LogIn className="mb-1.5 h-9 w-9 sm:mb-2 sm:h-11 sm:w-11" strokeWidth={2.2} />
              )}
              <span className="text-base font-semibold tracking-tight sm:text-lg">
                {mode === "CHECK_IN"
                  ? "Check In"
                  : mode === "CHECK_OUT"
                    ? "Check Out"
                    : "Completed"}
              </span>
              {punching ? (
                <span className="absolute bottom-6 text-xs text-subtext sm:bottom-7">
                  Saving...
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {error ? (
          <p className="mb-2 shrink-0 rounded-xl bg-red-50/80 px-3 py-2 text-center text-sm text-danger backdrop-blur-sm">
            {error}
          </p>
        ) : null}

        <div className="mt-auto shrink-0 space-y-2">
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            <StatTile
              icon={<LogIn className="h-3.5 w-3.5" />}
              tone="primary"
              label="Check In"
              value={formatTime(today?.checkInAt)}
            />
            <StatTile
              icon={<LogOut className="h-3.5 w-3.5" />}
              tone="danger"
              label="Check Out"
              value={formatTime(today?.checkOutAt)}
            />
            <StatTile
              icon={<Timer className="h-3.5 w-3.5" />}
              tone="cyan"
              label="Total Hrs"
              value={formatHours(today?.checkInAt, today?.checkOutAt)}
            />
          </div>

          {today?.checkInAt ? (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className="liquid-glass group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-red-50/50 sm:rounded-[20px] sm:px-3.5 sm:py-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md shadow-red-500/25">
                <Trash2 className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  Reset today&apos;s punch
                </span>
                <span className="mt-0.5 block text-xs text-subtext">
                  Clear check-in & check-out for today
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-danger/25 bg-red-50 px-3 py-1.5 text-xs font-semibold text-danger transition group-hover:bg-danger group-hover:text-white">
                Delete
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Quotes — mobile below punch */}
      <QuotesPanel
        quote={quote}
        quoteIndex={quoteIndex}
        quoteKey={quoteKey}
        onNext={nextQuote}
        className="col-span-2 md:hidden"
        compact
      />

      {showDeleteModal ? (
        <DeletePunchModal
          checkIn={formatTime(today?.checkInAt)}
          checkOut={formatTime(today?.checkOutAt)}
          total={formatHours(today?.checkInAt, today?.checkOutAt)}
          deleting={deleting}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={deleteTodayPunch}
        />
      ) : null}
    </div>
  );
}

function DeletePunchModal({
  checkIn,
  checkOut,
  total,
  deleting,
  onCancel,
  onConfirm,
}: {
  checkIn: string;
  checkOut: string;
  total: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onCancel}
        disabled={deleting}
      />
      <div className="liquid-glass-strong relative z-10 w-full max-w-md rounded-[28px] p-5 shadow-2xl fade-up sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30">
            <Trash2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-heading text-lg font-semibold tracking-tight">
              Delete today&apos;s punch?
            </h3>
            <p className="mt-1 text-sm text-subtext">
              This clears today&apos;s attendance. You can check in again after
              deleting.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-white/60 bg-white/50 p-3">
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-subtext">
              Check In
            </p>
            <p className="mt-1 text-sm font-semibold">{checkIn}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-subtext">
              Check Out
            </p>
            <p className="mt-1 text-sm font-semibold">{checkOut}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-subtext">
              Total
            </p>
            <p className="mt-1 text-sm font-semibold">{total}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-white disabled:opacity-60"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition hover:brightness-105 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuotesPanel({
  quote,
  quoteIndex,
  quoteKey,
  onNext,
  className,
  compact,
}: {
  quote: { text: string; author: string };
  quoteIndex: number;
  quoteKey: number;
  onNext: () => void;
  className?: string;
  compact?: boolean;
}) {
  const bg = backgroundAtIndex(quoteIndex);

  return (
    <div
      className={cn(
        "fade-up-delay relative flex min-h-0 flex-col overflow-hidden rounded-[24px] border border-white/40 shadow-[0_18px_50px_rgba(15,53,96,0.14)] sm:rounded-[28px]",
        compact ? "min-h-[220px]" : "min-h-0",
        className
      )}
    >
      {/* Dynamic scenic / gradient background */}
      <div
        key={`bg-${quoteKey}`}
        className="absolute inset-0 animate-[fadeUp_0.6s_ease-out] transition-[background-image] duration-700"
        style={{
          backgroundImage: bg.image
            ? `linear-gradient(160deg, rgba(8,47,73,0.55) 0%, rgba(3,105,161,0.45) 40%, rgba(15,23,42,0.72) 100%), url(${bg.image})`
            : bg.gradient,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Soft liquid sheen */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: bg.gradient, mixBlendMode: "soft-light" }}
      />
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-cyan/30 blur-3xl" />

      <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col p-4 sm:p-5 lg:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/30 bg-white/20 text-white backdrop-blur-md">
              <Quote className="h-4 w-4" />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-white sm:text-base">
                Daily motivation
              </p>
              <p className="text-[11px] text-white/75">Stay inspired today</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNext}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/35 bg-white/20 text-white backdrop-blur-md transition hover:bg-white/35"
            aria-label="Next quote"
            title="Next quote"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div
          className={cn(
            "flex flex-1 flex-col justify-center",
            compact ? "mt-4 py-3" : "mt-6"
          )}
        >
          <div
            key={`quote-${quoteKey}`}
            className="animate-[fadeUp_0.45s_ease-out] rounded-2xl border border-white/25 bg-white/15 p-4 shadow-lg backdrop-blur-xl sm:rounded-3xl sm:p-5"
          >
            <p
              className={cn(
                "font-heading font-semibold leading-snug text-white drop-shadow-sm",
                compact ? "text-base" : "text-lg lg:text-xl"
              )}
            >
              “{quote.text}”
            </p>
            <p
              className="mt-3 text-sm font-medium"
              style={{ color: bg.accent }}
            >
              — {quote.author}
            </p>
          </div>
        </div>

        <Link
          href="/staff/calendar"
          className="mt-4 flex shrink-0 items-center gap-3 rounded-2xl border border-white/30 bg-white/15 px-3 py-3 backdrop-blur-xl transition hover:bg-white/25"
        >
          <div className="rounded-xl bg-white/25 p-2 text-white">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">View calendar</p>
            <p className="truncate text-xs text-white/70">
              History, holidays & leaves
            </p>
          </div>
          <span className="text-sm font-medium text-white/90">Open →</span>
        </Link>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  tone,
  label,
  value,
}: {
  icon: React.ReactNode;
  tone: "primary" | "danger" | "cyan";
  label: string;
  value: string;
}) {
  const iconWrap =
    tone === "danger"
      ? "bg-danger/10 text-danger"
      : tone === "cyan"
        ? "bg-cyan/15 text-primary"
        : "bg-primary/10 text-primary";

  return (
    <div className="liquid-glass rounded-2xl px-2 py-2.5 text-center sm:rounded-[20px] sm:px-3 sm:py-3.5">
      <div
        className={cn(
          "mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg sm:mb-2 sm:h-8 sm:w-8 sm:rounded-xl",
          iconWrap
        )}
      >
        {icon}
      </div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-subtext sm:text-[11px]">
        {label}
      </p>
      <p className="mt-0.5 text-[13px] font-semibold leading-tight sm:mt-1 sm:text-base">
        {value}
      </p>
    </div>
  );
}
