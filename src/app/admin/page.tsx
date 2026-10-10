"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardCheck, Plane, Users } from "lucide-react";

type Stats = {
  staffCount: number;
  presentToday: number;
  pendingLeaves: number;
  holidaysCount: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  const cards = [
    {
      label: "Active staff",
      value: stats?.staffCount ?? "—",
      icon: Users,
      href: "/admin/staff",
    },
    {
      label: "Present today",
      value: stats?.presentToday ?? "—",
      icon: ClipboardCheck,
      href: "/admin/attendance",
    },
    {
      label: "Pending day offs",
      value: stats?.pendingLeaves ?? "—",
      icon: Plane,
      href: "/admin/leaves",
    },
    {
      label: "Holidays",
      value: stats?.holidaysCount ?? "—",
      icon: CalendarDays,
      href: "/admin/holidays",
    },
  ];

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-subtext text-sm mt-1">
          Overview of attendance and day off activity
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="liquid-glass rounded-[24px] p-5 transition hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-subtext">{label}</p>
              <span className="rounded-xl bg-gradient-to-br from-primary to-cyan p-2.5 text-white shadow-md shadow-primary/20">
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-heading font-semibold">{value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
