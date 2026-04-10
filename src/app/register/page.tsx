"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getClientToken, setClientToken } from "@/lib/client-auth";
import { SocialLogo } from "@/components/social-logo";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    first_name: "",
    last_name: ""
  });
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

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Registration failed.");
      return;
    }

    setClientToken(data.token);
    router.replace("/feed");
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-6 px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-[0.9fr_1.1fr] md:items-center">
      <div className="md:col-span-2">
        <SocialLogo href="/" />
      </div>

      <div className="md:col-span-2 grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <section className="hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-300/10 via-transparent to-emerald-300/10 p-8 md:block">
          <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
            Start in one minute
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-white">Create your account and start posting.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Keep it simple: register, follow people, publish media posts, and stay in your own clean social loop.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
          <h2 className="text-3xl font-semibold text-white">Create account</h2>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <input
              required
              placeholder="Email"
              className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2.5 text-white outline-none ring-0 transition focus:border-emerald-300/50"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <input
              required
              placeholder="Username"
              className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2.5 text-white outline-none ring-0 transition focus:border-emerald-300/50"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="First name"
                className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2.5 text-white outline-none ring-0 transition focus:border-emerald-300/50"
                value={form.first_name}
                onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
              />
              <input
                required
                placeholder="Last name"
                className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2.5 text-white outline-none ring-0 transition focus:border-emerald-300/50"
                value={form.last_name}
                onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
              />
            </div>
            <input
              required
              type="password"
              placeholder="Password"
              className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2.5 text-white outline-none ring-0 transition focus:border-emerald-300/50"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <button
              disabled={loading}
              className="w-full rounded-xl bg-accent px-4 py-2.5 font-medium text-accent-foreground transition hover:-translate-y-0.5 disabled:opacity-70"
            >
              {loading ? "Creating..." : "Create account"}
            </button>
            <p className="pt-1 text-center text-sm text-slate-300">
              Already have an account?{" "}
              <Link href="/login" className="text-emerald-300 underline underline-offset-4">
                Login
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}