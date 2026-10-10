"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Plane } from "lucide-react";

type Profile = {
  employeeId: string | null;
  phone: string | null;
  department: string | null;
};

export default function StaffProfilePage() {
  const { data } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((json) => setProfile(json.user || null));
  }, []);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-subtext">Your staff account</p>
      </div>

      <section className="bg-white rounded-[28px] card-shadow p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-heading font-semibold">
            {(data?.user?.name || "?").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-semibold">{data?.user?.name}</p>
            <p className="text-sm text-subtext">@{data?.user?.username}</p>
          </div>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between rounded-2xl bg-soft-blue-2 px-4 py-3">
            <dt className="text-subtext">Employee ID</dt>
            <dd className="font-medium">{profile?.employeeId || "—"}</dd>
          </div>
          <div className="flex justify-between rounded-2xl bg-soft-blue-2 px-4 py-3">
            <dt className="text-subtext">Department</dt>
            <dd className="font-medium">{profile?.department || "—"}</dd>
          </div>
          <div className="flex justify-between rounded-2xl bg-soft-blue-2 px-4 py-3">
            <dt className="text-subtext">Phone</dt>
            <dd className="font-medium">{profile?.phone || "—"}</dd>
          </div>
          <div className="flex justify-between rounded-2xl bg-soft-blue-2 px-4 py-3">
            <dt className="text-subtext">Role</dt>
            <dd className="font-medium">Staff</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/staff/leaves"
            className="flex items-center justify-center gap-2 rounded-2xl border border-border py-3 font-medium"
          >
            <Plane className="h-4 w-4" /> Day off requests
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center justify-center gap-2 rounded-2xl bg-danger text-white py-3 font-medium"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </section>
    </div>
  );
}
