"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { getClientToken } from "@/lib/client-auth";

type NotificationItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  created_at: string;
};

export function NotificationsBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const unreadCount = items.length;

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      const token = getClientToken();

      if (!token) {
        return;
      }

      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!cancelled && response.ok) {
        setItems(data.items ?? []);
      }
    }

    void loadNotifications();
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed right-4 top-4 z-50">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white shadow-lg backdrop-blur"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white ring-2 ring-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">Notifications</p>
            <p className="text-xs text-slate-400">Live updates refresh automatically</p>
          </div>
          <div className="max-h-[420px] space-y-1 overflow-y-auto p-2">
            {items.length === 0 ? <p className="px-3 py-4 text-sm text-slate-400">No new notifications.</p> : null}
            {items.map((item) => (
              <a key={item.id} href={item.href} className="block rounded-xl px-3 py-2 hover:bg-white/5">
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-slate-400">{item.subtitle}</p>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
