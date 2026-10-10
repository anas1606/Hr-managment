"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { format } from "date-fns";

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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Holidays</h1>
        <p className="text-sm text-subtext">
          Company holidays shown on staff calendars
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-white rounded-[28px] card-shadow p-5 space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-border px-3 py-2.5 bg-soft-blue-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Independence Day"
              className="mt-1 w-full rounded-2xl border border-border px-3 py-2.5 bg-soft-blue-2"
            />
          </div>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          className="rounded-2xl bg-primary text-white px-5 py-2.5 font-medium"
        >
          Add holiday
        </button>
      </form>

      <ul className="space-y-2">
        {holidays.map((h) => (
          <li
            key={h.id}
            className="bg-white rounded-2xl card-shadow px-4 py-3 flex items-center justify-between gap-3"
          >
            <div>
              <p className="font-medium">{h.name}</p>
              <p className="text-sm text-subtext">
                {format(new Date(h.date), "EEEE, MMM d, yyyy")}
              </p>
            </div>
            <button
              onClick={() => remove(h.id)}
              className="text-sm text-danger font-medium"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
