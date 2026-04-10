"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NotificationsBell } from "@/components/notifications-bell";
import { SocialLogo } from "@/components/social-logo";
import { getClientToken } from "@/lib/client-auth";

type UserResult = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string | null;
  preview_media_url: string | null;
  preview_media_type: "image" | "video" | null;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [featuredUsers, setFeaturedUsers] = useState<UserResult[]>([]);
  const [items, setItems] = useState<UserResult[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  const loadFeaturedUsers = useCallback(async () => {
    const response = await fetch("/api/users?page=1&limit=6&featured=true");
    const data = await response.json();

    if (response.ok) {
      setFeaturedUsers(data.items ?? []);
    }
  }, []);

  const loadFollowing = useCallback(async () => {
    const token = getClientToken();

    if (!token) {
      return;
    }

    const meResponse = await fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!meResponse.ok) {
      return;
    }

    const meData = await meResponse.json();
    const followingResponse = await fetch(`/api/users/${meData.user.id}/following?page=1&limit=100`);
    const followingData = await followingResponse.json();

    if (followingResponse.ok) {
      setFollowingIds((followingData.items ?? []).map((item: { id: string }) => item.id));
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!trimmedQuery) {
        setItems([]);
        setError("");
        void loadFeaturedUsers();
        void loadFollowing();
        return;
      }

      setLoading(true);
      setError("");

      const response = await fetch(`/api/users?page=1&limit=20&q=${encodeURIComponent(trimmedQuery)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to search users.");
        setLoading(false);
        return;
      }

      setItems(data.items ?? []);
      setLoading(false);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [trimmedQuery, loadFeaturedUsers, loadFollowing]);

  async function toggleFollow(userId: string) {
    const token = getClientToken();

    if (!token) {
      setError("Login first.");
      return;
    }

    const isFollowing = followingIds.includes(userId);

    const response = await fetch(`/api/users/${userId}/follow`, {
      method: isFollowing ? "DELETE" : "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      setFollowingIds((prev) => (isFollowing ? prev.filter((id) => id !== userId) : [...prev, userId]));
      return;
    }

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to follow user.");
    }
  }

  return (
    <div className="min-h-screen bg-[#040b14] text-white">
      <NotificationsBell />
      <div className="mx-auto flex max-w-[1400px]">
        <AppSidebar active="search" />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <SocialLogo href={"/feed" as Route} />
            <Link href={"/messages" as Route} className="rounded-full border border-white/20 px-3 py-1 text-sm text-slate-200">
              Messages
            </Link>
          </div>

          <section className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-black/25 p-5 sm:p-6">
            <h1 className="text-2xl font-semibold">Search users</h1>
            <p className="mt-2 text-sm text-slate-300">Find profiles, open profile pages, and follow people.</p>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by username, first name, last name"
              className="mt-4 w-full rounded-xl border border-white/20 bg-slate-900/70 px-4 py-3 text-white"
            />
            {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
            {loading ? <p className="mt-3 text-sm text-slate-300">Searching...</p> : null}

            {!trimmedQuery ? (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Featured users</h2>
                  <span className="text-xs text-slate-400">With recent media</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {featuredUsers.map((user) => (
                    <article key={user.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      <div className="aspect-[4/3] bg-black/20">
                        {user.preview_media_url ? (
                          user.preview_media_type === "video" ? (
                            <video className="h-full w-full object-cover" muted playsInline>
                              <source src={user.preview_media_url} />
                            </video>
                          ) : (
                            <Image src={user.preview_media_url} alt={user.username} width={600} height={450} className="h-full w-full object-cover" />
                          )
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-slate-400">No media preview</div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 p-4">
                        <div>
                          <p className="text-sm font-medium text-white">{user.username}</p>
                          <p className="text-xs text-slate-300">{user.first_name} {user.last_name}</p>
                        </div>
                        <button type="button" onClick={() => toggleFollow(user.id)} className="rounded-lg bg-[#26457f] px-3 py-1.5 text-xs font-medium text-white">
                          {followingIds.includes(user.id) ? "Unfollow" : "Follow"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {items.map((user) => (
                <article key={user.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <Image src={user.avatar_url} alt={user.username} width={42} height={42} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-sm">
                        {user.username.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{user.username}</p>
                      <p className="text-xs text-slate-300">{user.first_name} {user.last_name}</p>
                    </div>
                  </div>
                  {user.preview_media_url ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                      {user.preview_media_type === "video" ? (
                        <video className="h-36 w-full object-cover" muted playsInline>
                          <source src={user.preview_media_url} />
                        </video>
                      ) : (
                        <Image src={user.preview_media_url} alt={user.username} width={800} height={180} className="h-36 w-full object-cover" />
                      )}
                    </div>
                  ) : null}
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Link href={`/users/${user.id}` as Route} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white">
                      View profile
                    </Link>
                    <button type="button" onClick={() => toggleFollow(user.id)} className="rounded-lg bg-[#26457f] px-3 py-1.5 text-xs font-medium text-white">
                      {followingIds.includes(user.id) ? "Unfollow" : "Follow"}
                    </button>
                  </div>
                </article>
              ))}
              {!loading && trimmedQuery && items.length === 0 ? <p className="text-sm text-slate-300">No users found.</p> : null}
            </div>
          </section>
        </main>
      </div>

      <div className="pb-20 lg:hidden">
        <MobileBottomNav active="search" />
      </div>
    </div>
  );
}
