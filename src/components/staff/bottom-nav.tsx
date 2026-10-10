"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Plane, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/staff", label: "Home", icon: Home },
  { href: "/staff/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/staff/leaves", label: "Day off", icon: Plane },
  { href: "/staff/profile", label: "Profile", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[min(420px,calc(100%-1.5rem))] -translate-x-1/2 md:hidden">
      <div className="bottom-nav flex items-center justify-around rounded-full border border-white/25 bg-gradient-to-r from-primary-dark/95 via-primary/95 to-[#0284c7]/95 px-2 py-2 text-white">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/staff"
              ? pathname === "/staff"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 text-[10px] transition sm:px-4 sm:text-[11px]",
                active
                  ? "bg-white text-primary shadow-sm"
                  : "opacity-85 hover:opacity-100"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
