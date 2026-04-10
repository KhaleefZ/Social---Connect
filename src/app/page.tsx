"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useSyncExternalStore } from "react";
import {
  getClientToken,
  getHasTokenServerSnapshot,
  getHasTokenSnapshot,
  setClientToken,
  subscribeAuthStore
} from "@/lib/client-auth";
import { SocialLogo } from "@/components/social-logo";

export default function HomePage() {
  const router = useRouter();
  const hasToken = useSyncExternalStore(
    subscribeAuthStore,
    getHasTokenSnapshot,
    getHasTokenServerSnapshot
  );
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [registerForm, setRegisterForm] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
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

  async function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerForm)
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

  const showFeedActions = hasToken || Boolean(getClientToken());

  return (
    <main className="mx-auto min-h-screen max-w-[1360px] px-4 py-6 sm:px-6 sm:py-8">
      <section className="grid min-h-[calc(100vh-3rem)] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0f18] lg:grid-cols-[1.2fr_0.95fr]">
        <div className="relative flex flex-col justify-between p-8 sm:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(59,130,246,0.2),transparent_55%),radial-gradient(circle_at_68%_90%,rgba(236,72,153,0.16),transparent_55%)]" />
          <div className="relative">
            <SocialLogo href="/" />
            <h1 className="mt-12 max-w-xl text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
              See everyday moments from your people.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              Post photos and videos, follow your circle, and stay connected in a clean and focused social timeline.
            </p>
            <div className="mt-6 space-y-2 text-sm text-slate-300">
              <p>Real-time conversations with connected people.</p>
              <p>Follow-based feed so your timeline stays relevant.</p>
              <p>Private profile controls for email and phone details.</p>
            </div>
          </div>

          <div className="relative mt-8 grid max-w-md grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-300">
              <p>Feed</p>
              <p className="mt-1 text-lg font-semibold text-white">Follow-first</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-300">
              <p>Posts</p>
              <p className="mt-1 text-lg font-semibold text-white">Photo + video</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center border-l border-white/10 bg-[#131722] p-6 sm:p-10">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/20 p-6 sm:p-8">
            {showFeedActions ? (
              <>
                <h2 className="text-3xl font-semibold text-white">Welcome back</h2>
                <p className="mt-2 text-sm text-slate-300">Continue where you left off.</p>

                <div className="mt-8 space-y-3">
                  <Link href="/feed" className="block w-full rounded-xl bg-accent px-4 py-3 text-center font-medium text-accent-foreground">
                    Continue to feed
                  </Link>
                  <Link href="/me" className="block w-full rounded-xl border border-white/20 px-4 py-3 text-center text-white">
                    Open profile
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-semibold text-white">Welcome</h2>
                <p className="mt-2 text-sm text-slate-300">Login or create an account to continue.</p>

                <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-slate-900/40 p-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className={`rounded-lg px-3 py-2 transition ${activeTab === "login" ? "bg-white/10 text-white" : "text-slate-300"}`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className={`rounded-lg px-3 py-2 transition ${activeTab === "register" ? "bg-white/10 text-white" : "text-slate-300"}`}
                  >
                    Register
                  </button>
                </div>

                {activeTab === "login" ? (
                  <form onSubmit={submitLogin} className="mt-5 space-y-3">
                    <input
                      required
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      placeholder="Email or username"
                      className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2.5 text-white"
                    />
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Password"
                      className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2.5 text-white"
                    />
                    {error ? <p className="text-sm text-rose-300">{error}</p> : null}
                    <button disabled={loading} className="w-full rounded-xl bg-[#26457f] px-4 py-3 text-center font-medium text-white disabled:opacity-70">
                      {loading ? "Signing in..." : "Sign in"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={submitRegister} className="mt-5 space-y-3">
                    <input
                      required
                      type="email"
                      value={registerForm.email}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="Email"
                      className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2.5 text-white"
                    />
                    <input
                      required
                      value={registerForm.username}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, username: event.target.value }))}
                      placeholder="Username"
                      className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2.5 text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        required
                        value={registerForm.first_name}
                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, first_name: event.target.value }))}
                        placeholder="First name"
                        className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2.5 text-white"
                      />
                      <input
                        required
                        value={registerForm.last_name}
                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, last_name: event.target.value }))}
                        placeholder="Last name"
                        className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2.5 text-white"
                      />
                    </div>
                    <input
                      required
                      type="password"
                      value={registerForm.password}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="Password"
                      className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2.5 text-white"
                    />
                    {error ? <p className="text-sm text-rose-300">{error}</p> : null}
                    <button disabled={loading} className="w-full rounded-xl border border-[#3b82f6] bg-[#26457f] px-4 py-3 text-center font-medium text-white disabled:opacity-70">
                      {loading ? "Creating..." : "Create account"}
                    </button>
                  </form>
                )}
              </>
            )}

          </div>
        </div>
      </section>
    </main>
  );
}