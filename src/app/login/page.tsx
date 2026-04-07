"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getClientToken, setClientToken } from "@/lib/client-auth";
import { TopNav } from "@/components/top-nav";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (getClientToken()) {
      router.replace("/feed");
    }
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Login failed.");
      return;
    }

    setClientToken(data.token);
    router.replace("/feed");
  }

  return (
    <div>
      <TopNav />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <section className="hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-300/15 via-transparent to-cyan-300/10 p-8 md:block">
          <p className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
            Welcome back
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-white">Login and continue your flow.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Minimal, fast, and focused. Open your feed, keep your profile updated, and interact with people you follow.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
          <h2 className="text-3xl font-semibold text-white">Login</h2>
          <p className="mt-2 text-sm text-slate-300">Use username or email with password.</p>
          <p className="mt-1 text-sm text-slate-300">
            New here?{" "}
            <Link href="/register" className="text-emerald-300 underline underline-offset-4">
              Create account
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <input
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Email or username"
              className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2.5 text-white outline-none ring-0 transition focus:border-emerald-300/50"
            />
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2.5 text-white outline-none ring-0 transition focus:border-emerald-300/50"
            />
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <button
              disabled={loading}
              className="w-full rounded-xl bg-accent px-4 py-2.5 font-medium text-accent-foreground transition hover:-translate-y-0.5 disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}