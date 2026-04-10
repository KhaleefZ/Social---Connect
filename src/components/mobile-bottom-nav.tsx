"use client";

import type { Route } from "next";
import Link from "next/link";
import { Home, MessageCircle, Search, User } from "lucide-react";

type MobileBottomNavProps = {
  active: "feed" | "profile" | "search" | "messages";
};

export function MobileBottomNav({ active }: MobileBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 px-2 py-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 text-center text-[11px] text-slate-300">
        <Link href={"/feed" as Route} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 ${active === "feed" ? "text-white" : ""}`}>
          <Home size={18} />
          Home
        </Link>
        <Link href={"/search" as Route} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 ${active === "search" ? "text-white" : ""}`}>
          <Search size={18} />
          Search
        </Link>
        <Link href={"/messages" as Route} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 ${active === "messages" ? "text-white" : ""}`}>
          <MessageCircle size={18} />
          Chats
        </Link>
        <Link href={"/me" as Route} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 ${active === "profile" ? "text-white" : ""}`}>
          <User size={18} />
          Profile
        </Link>
      </div>
    </nav>
  );
}
