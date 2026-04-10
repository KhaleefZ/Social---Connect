"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  clearClientToken,
  getClientToken,
  getHasTokenServerSnapshot,
  getHasTokenSnapshot,
  subscribeAuthStore
} from "@/lib/client-auth";
import { SocialLogo } from "@/components/social-logo";

export function TopNav() {
  const hasToken = useSyncExternalStore(
    subscribeAuthStore,
    getHasTokenSnapshot,
    getHasTokenServerSnapshot
  );
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <SocialLogo href={"/" as Route} />
        <div className="flex flex-wrap items-center justify-end gap-2 text-sm text-slate-200 sm:gap-3">
          {hasToken ? (
            <>
              <Link
                href={"/feed" as Route}
                className="rounded-full border border-white/15 px-3 py-1.5 transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Feed
              </Link>
              <Link
                href={"/me" as Route}
                className="rounded-full border border-white/15 px-3 py-1.5 transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={async () => {
                  const token = getClientToken();

                  if (token) {
                    await fetch("/api/auth/logout", {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`
                      }
                    });
                  }

                  clearClientToken();
                  router.replace("/");
                }}
                className="rounded-full bg-white px-3 py-1.5 font-medium text-slate-900 transition hover:-translate-y-0.5"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href={"/" as Route}
                className="rounded-full border border-white/15 px-3 py-1.5 transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Login
              </Link>
              <Link
                href={"/" as Route}
                className="rounded-full border border-white/15 px-3 py-1.5 transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}