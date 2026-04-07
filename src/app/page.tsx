"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  getHasTokenServerSnapshot,
  getHasTokenSnapshot,
  subscribeAuthStore
} from "@/lib/client-auth";

export default function HomePage() {
  const hasToken = useSyncExternalStore(
    subscribeAuthStore,
    getHasTokenSnapshot,
    getHasTokenServerSnapshot
  );

  return (
    <main className="relative isolate mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.2),transparent_60%)]" />
      <section className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-7 shadow-glow backdrop-blur md:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="inline-flex rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-medium tracking-wide text-emerald-200">
              Minimal social app
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
              Share once, connect always.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
              Clean social flow with posts, follows, likes, comments, media upload, and profile control in one focused experience.
            </p>

            {hasToken ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/feed"
                  className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-foreground transition hover:-translate-y-0.5 hover:opacity-90"
                >
                  Continue to feed
                </Link>
                <Link
                  href="/me"
                  className="rounded-full border border-white/15 px-5 py-3 text-sm text-slate-100 transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Open profile
                </Link>
              </div>
            ) : (
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-foreground transition hover:-translate-y-0.5 hover:opacity-90"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-white/15 px-5 py-3 text-sm text-slate-100 transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Login
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-slate-300">Timeline</p>
              <p className="mt-2 text-xl font-semibold text-white">Follow-only</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-slate-300">Media posts</p>
              <p className="mt-2 text-xl font-semibold text-white">Photo + video</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-slate-300">Identity</p>
              <p className="mt-2 text-xl font-semibold text-white">Username-first</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-slate-300">Profile edit</p>
              <p className="mt-2 text-xl font-semibold text-white">On demand</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}