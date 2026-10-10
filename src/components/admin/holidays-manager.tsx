"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarPlus, Trash2 } from "lucide-react";

type Holiday = { id: string; date: string; name: string };

export function HolidaysManager() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/holidays");
    const json = await res.json();
    setHolidays(json.holidays || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, name }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to add holiday");
      return;
    }
    setDate("");
    setName("");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/holidays?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Holidays
        </h1>
        <p className="mt-1 text-sm text-subtext">
          Company holidays shown on staff calendars
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="liquid-glass space-y-4 rounded-[24px] p-4 sm:rounded-[28px] sm:p-5"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft-blue text-primary">
            <CalendarPlus className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Add holiday</p>
            <p className="text-xs text-subtext">Pick a date and give it a name</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-subtext">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-subtext">
              Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Independence Day"
              className="field-input"
            />
          </div>
        </div>
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          Add holiday
        </button>
      </form>

      <ul className="space-y-2">
        {holidays.map((h) => (
          <li
            key={h.id}
            className="liquid-glass flex items-center justify-between gap-3 rounded-[22px] px-4 py-3.5 sm:rounded-[24px]"
          >
            <div>
              <p className="font-medium">{h.name}</p>
              <p className="text-sm text-subtext">
                {format(new Date(h.date), "EEEE, MMM d, yyyy")}
              </p>
            </div>
            <button
              onClick={() => remove(h.id)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger hover:text-white"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </li>
        ))}
        {holidays.length === 0 ? (
          <li className="liquid-glass rounded-[22px] px-4 py-10 text-center text-sm text-subtext sm:rounded-[24px]">
            No holidays added yet
          </li>
        ) : null}
      </ul>
    </div>
  );
}
