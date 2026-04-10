"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, LogOut, MessageCircle, Search, User } from "lucide-react";
import { clearClientToken, getClientToken } from "@/lib/client-auth";
import { SocialLogo } from "@/components/social-logo";

type AppSidebarProps = {
  active: "feed" | "profile" | "search" | "messages";
};

export function AppSidebar({ active }: AppSidebarProps) {
  const router = useRouter();

  async function logout() {
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
  }

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-white/10 bg-black/30 p-5 lg:flex lg:flex-col lg:justify-between">
      <div>
        <div className="px-2 py-3">
          <SocialLogo href={"/feed" as Route} />
        </div>

        <nav className="mt-6 space-y-1 text-slate-200">
          <Link href={"/feed" as Route} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${active === "feed" ? "bg-white/10 text-white" : "hover:bg-white/5"}`}>
            <Home size={19} /> Home
          </Link>
          <Link href={"/search" as Route} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${active === "search" ? "bg-white/10 text-white" : "hover:bg-white/5"}`}>
            <Search size={19} /> Search
          </Link>
          <Link href={"/messages" as Route} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${active === "messages" ? "bg-white/10 text-white" : "hover:bg-white/5"}`}>
            <MessageCircle size={19} /> Messages
          </Link>
          <Link href={"/me" as Route} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${active === "profile" ? "bg-white/10 text-white" : "hover:bg-white/5"}`}>
            <User size={19} /> Profile
          </Link>
        </nav>
      </div>

      <button
        type="button"
        onClick={() => {
          void logout();
        }}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-200 hover:bg-white/5"
      >
        <LogOut size={19} /> Logout
      </button>
    </aside>
  );
}
