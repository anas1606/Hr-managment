"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Plane,
  Users,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/attendance", label: "Attendance", icon: ClipboardList },
  { href: "/admin/leaves", label: "Day off", icon: Plane },
  { href: "/admin/holidays", label: "Holidays", icon: CalendarDays },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useSession();
  const initial = (data?.user?.name || "A").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen">
      <aside className="liquid-sidebar fixed bottom-4 left-4 top-4 z-30 hidden w-[260px] flex-col overflow-hidden rounded-[36px] md:flex">
        <div className="px-5 py-6">
          <div className="flex items-center gap-3">
            <BrandLogo size={40} className="h-10 w-10 shrink-0" />
            <div>
              <p className="font-heading text-lg font-semibold leading-tight text-primary lg:text-xl">
                Quba Infotech
              </p>
              <p className="mt-1 text-xs text-subtext">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1.5 px-3">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition",
                  active
                    ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/25"
                    : "text-foreground/75 hover:bg-white/70 hover:text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="m-3 rounded-2xl border border-white/80 bg-white/55 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan font-semibold text-white">
              {initial}
            </div>
            <div>
              <p className="text-sm font-semibold">{data?.user?.name}</p>
              <p className="text-xs text-subtext">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm font-medium text-danger transition hover:bg-red-50/80"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="md:pl-[284px]">
        <header className="liquid-glass sticky top-0 z-20 border-b border-white/40 px-4 py-3 md:hidden">
          <p className="font-heading font-semibold text-primary">
            Quba Infotech Admin
          </p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium",
                  pathname === href ||
                    (href !== "/admin" && pathname.startsWith(href))
                    ? "bg-primary text-white"
                    : "bg-white/50 text-primary"
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </header>
        <main className="px-4 py-5 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
