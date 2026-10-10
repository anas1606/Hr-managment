"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username: username.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid username or password");
      return;
    }

    router.refresh();
    router.push("/");
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand plane */}
      <section className="relative flex min-h-[38vh] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0078d4] via-primary to-[#003d73] px-7 py-8 text-white sm:px-10 sm:py-10 lg:min-h-dvh lg:px-14 lg:py-12">
        <div
          aria-hidden
          className="login-orb pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-cyan/35 blur-3xl"
        />
        <div
          aria-hidden
          className="login-orb-delay pointer-events-none absolute -left-16 bottom-10 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="login-card-enter relative z-10 flex items-center gap-3">
          <BrandLogo
            size={48}
            className="h-12 w-12 rounded-2xl shadow-lg shadow-black/20 ring-2 ring-white/25"
          />
          <span className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
            Quba Infotech
          </span>
        </div>

        <div className="login-card-enter relative z-10 mt-10 max-w-md lg:mt-0">
          <p className="font-heading text-3xl font-semibold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
            Attendance,
            <br />
            simplified.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75 sm:text-base">
            Punch in, track day offs, and keep your team day in sync — all in one
            place.
          </p>
        </div>

        <p className="login-card-enter relative z-10 mt-8 hidden text-xs text-white/50 lg:block">
          Staff & admin access
        </p>
      </section>

      {/* Form plane */}
      <section className="relative flex items-center justify-center bg-[#f4f8fc] px-5 py-10 sm:px-8 lg:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_0%,rgba(0,111,199,0.08),transparent_55%)]"
        />

        <div className="login-card-enter relative w-full max-w-[400px]">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-subtext">
            Sign in to continue to your attendance dashboard.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-[13px] font-medium text-foreground/75"
              >
                Username
              </label>
              <div className="group relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtext transition group-focus-within:text-primary" />
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-[#cfe0f0] bg-white py-3.5 pl-11 pr-4 text-[15px] outline-none transition placeholder:text-subtext/65 focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,111,199,0.12)]"
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-[13px] font-medium text-foreground/75"
              >
                Password
              </label>
              <div className="group relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtext transition group-focus-within:text-primary" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#cfe0f0] bg-white py-3.5 pl-11 pr-11 text-[15px] outline-none transition placeholder:text-subtext/65 focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,111,199,0.12)]"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtext transition hover:text-primary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-danger">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-[15px] font-semibold text-white transition duration-200 hover:bg-primary-dark active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading ? (
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              ) : null}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
