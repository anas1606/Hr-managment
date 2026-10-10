"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, LogOut, Plane, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { BrandLogo } from "@/components/brand-logo";
import { BottomNav } from "@/components/staff/bottom-nav";
import { cn } from "@/lib/utils";

const links = [
  { href: "/staff", label: "Home", icon: Home },
  { href: "/staff/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/staff/leaves", label: "Leaves", icon: Plane },
  { href: "/staff/profile", label: "Profile", icon: UserRound },
];

export function StaffShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useSession();
  const initial = (data?.user?.name || "?").slice(0, 1).toUpperCase();
  const fillScreen =
    pathname === "/staff" || pathname.startsWith("/staff/calendar");

  return (
    <div className="min-h-dvh">
      <aside className="liquid-sidebar hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-[260px] md:flex-col lg:w-[272px]">
        <div className="px-5 py-6 lg:px-6 lg:py-7">
          <div className="flex items-center gap-3">
            <BrandLogo size={40} className="h-10 w-10 shrink-0" />
            <div>
              <p className="font-heading text-lg font-semibold leading-tight text-primary lg:text-xl">
                Quba Infotech
              </p>
              <p className="mt-1 text-xs text-subtext">Staff Attendance</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-3">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/staff"
                ? pathname === "/staff"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition",
                  active
                    ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/25"
                    : "text-foreground/75 hover:bg-white/50 hover:text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="liquid-glass m-3 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{data?.user?.name}</p>
              <p className="truncate text-xs text-subtext">
                @{data?.user?.username}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/60 bg-white/60 px-3 py-2 text-sm font-medium text-danger backdrop-blur-md transition hover:bg-red-50/80"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      <main
        className={cn(
          "bg-transparent md:pl-[260px] lg:pl-[272px]",
          fillScreen
            ? "h-dvh overflow-hidden pb-[5.75rem] md:pb-0"
            : "min-h-dvh pb-28 md:pb-8"
        )}
      >
        <div
          className={cn(
            "w-full bg-transparent",
            fillScreen
              ? "flex h-full min-h-0 flex-col px-3 pt-3 pb-2 sm:px-4 md:p-5 lg:p-6"
              : "mx-auto max-w-6xl px-3 pt-3 pb-4 sm:px-4 sm:py-5 md:px-8 md:py-8"
          )}
        >
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
