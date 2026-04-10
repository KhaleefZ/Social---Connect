"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NotificationsBell } from "@/components/notifications-bell";
import { SocialLogo } from "@/components/social-logo";
import { getClientToken } from "@/lib/client-auth";

type Contact = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
};

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
};

type Me = {
  id: string;
};

const demoContacts: Contact[] = [
  {
    id: "demo-a",
    username: "travel.studio",
    first_name: "Travel",
    last_name: "Studio",
    avatar_url: null
  },
  {
    id: "demo-b",
    username: "momentlane",
    first_name: "Moment",
    last_name: "Lane",
    avatar_url: null
  }
];

const demoThreads: Record<string, Message[]> = {
  "demo-a": [
    {
      id: "demo-a-1",
      sender_id: "demo-a",
      recipient_id: "me",
      content: "Hey, your profile grid looks clean.",
      created_at: new Date().toISOString()
    },
    {
      id: "demo-a-2",
      sender_id: "me",
      recipient_id: "demo-a",
      content: "Thanks. I want it to feel like Instagram.",
      created_at: new Date().toISOString()
    }
  ],
  "demo-b": [
    {
      id: "demo-b-1",
      sender_id: "demo-b",
      recipient_id: "me",
      content: "You should pin your best photo posts first.",
      created_at: new Date().toISOString()
    }
  ]
};

export default function MessagesPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeUserId, setActiveUserId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("user") ?? "";
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const activeContact = useMemo(
    () => contacts.find((item) => item.id === activeUserId) ?? demoContacts.find((item) => item.id === activeUserId) ?? null,
    [contacts, activeUserId]
  );
  const displayContacts = contacts.length > 0 ? contacts : demoContacts;
  const displayMessages = activeUserId.startsWith("demo-") ? demoThreads[activeUserId] ?? [] : messages;

  useEffect(() => {
    let cancelled = false;

    async function loadContacts() {
      const token = getClientToken();

      if (!token) {
        setError("Login first.");
        setLoading(false);
        return;
      }

      const [meRes, contactsRes] = await Promise.all([
        fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/messages/contacts", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const meData = await meRes.json();
      const contactsData = await contactsRes.json();

      if (!meRes.ok || !contactsRes.ok) {
        setError(meData.error ?? contactsData.error ?? "Unable to load messages.");
        setLoading(false);
        return;
      }

      setMe({ id: meData.user.id });
      setContacts(contactsData.items ?? []);
      setLoading(false);
    }

    void loadContacts();

    const onFocus = () => {
      void loadContacts();
    };
    window.addEventListener("focus", onFocus);

    const interval = window.setInterval(() => {
      if (!cancelled) {
        void loadContacts();
      }
    }, 8000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      if (activeUserId.startsWith("demo-")) {
        setMessages(demoThreads[activeUserId] ?? []);
        setLoading(false);
        return;
      }

      if (!activeUserId) {
        setMessages([]);
        return;
      }

      const token = getClientToken();

      if (!token) {
        return;
      }

      const response = await fetch(`/api/messages/with/${activeUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to load conversation.");
        return;
      }

      if (!cancelled) {
        setMessages(data.items ?? []);
      }
    }

    void loadMessages();

    const onFocus = () => {
      void loadMessages();
    };
    window.addEventListener("focus", onFocus);

    const interval = window.setInterval(() => {
      void loadMessages();
    }, 2000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [activeUserId]);

  async function sendMessage() {
    if (!activeUserId || !content.trim() || activeUserId.startsWith("demo-")) {
      return;
    }

    const token = getClientToken();

    if (!token) {
      setError("Login first.");
      return;
    }

    const response = await fetch(`/api/messages/with/${activeUserId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to send message.");
      return;
    }

    setMessages((prev) => [...prev, data.message]);
    setContent("");
  }

  return (
    <div className="min-h-screen bg-[#040b14] text-white">
      <NotificationsBell />
      <div className="mx-auto flex max-w-[1400px]">
        <AppSidebar active="messages" />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <SocialLogo href={"/feed" as Route} />
            <Link href={"/search" as Route} className="rounded-full border border-white/20 px-3 py-1 text-sm text-slate-200">
              Search
            </Link>
          </div>

          {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
          {loading ? <p className="mb-3 text-sm text-slate-300">Loading messages...</p> : null}

          <section className="grid min-h-[70vh] overflow-hidden rounded-2xl border border-white/10 bg-black/20 md:grid-cols-[280px_1fr]">
            <aside className="border-b border-white/10 p-4 md:border-b-0 md:border-r">
              <h1 className="text-lg font-semibold">Messages</h1>
              <p className="mt-1 text-xs text-slate-400">You can chat with connected followers/following users.</p>
              <div className="mt-4 space-y-2">
                {displayContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setActiveUserId(contact.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${activeUserId === contact.id ? "bg-white/10" : "hover:bg-white/5"}`}
                  >
                    {contact.avatar_url ? (
                      <Image src={contact.avatar_url} alt={contact.username} width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-xs">
                        {contact.username.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-slate-200">{contact.username}</span>
                  </button>
                ))}
                {!loading && contacts.length === 0 ? <p className="text-xs text-slate-400">Sample conversations are shown until you have connected users.</p> : null}
              </div>
            </aside>

            <div className="flex flex-col">
              <div className="border-b border-white/10 px-4 py-3">
                <p className="font-medium">{activeContact ? activeContact.username : "Select a conversation"}</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {displayMessages.map((message) => {
                  const isMine = me?.id === message.sender_id;

                  return (
                    <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMine ? "bg-[#26457f] text-white" : "bg-white/10 text-slate-100"}`}>
                        {message.content}
                      </div>
                    </div>
                  );
                })}
                {activeUserId && displayMessages.length === 0 ? <p className="text-sm text-slate-400">Start your conversation.</p> : null}
              </div>

              <div className="border-t border-white/10 p-3">
                <div className="flex gap-2">
                  <input
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder={activeUserId ? "Type a message..." : "Select a user to chat"}
                    disabled={!activeUserId}
                    className="w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-sm text-white disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={!activeUserId || !content.trim()}
                    onClick={() => {
                      void sendMessage();
                    }}
                    className="rounded-xl bg-[#26457f] px-4 py-2 text-sm font-medium disabled:opacity-60"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <div className="pb-20 lg:hidden">
        <MobileBottomNav active="messages" />
      </div>
    </div>
  );
}
