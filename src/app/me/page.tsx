"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { getClientToken } from "@/lib/client-auth";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NotificationsBell } from "@/components/notifications-bell";
import { SocialLogo } from "@/components/social-logo";

type Profile = {
  id: string;
  email: string;
  phone_number: string | null;
  username: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  location: string | null;
  posts_count: number;
  followers_count: number;
  following_count: number;
};

type OwnPost = {
  id: string;
  author_username: string;
  content: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  like_count: number;
  comment_count: number;
  created_at: string;
};

type FollowerPreview = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export default function MePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ownPosts, setOwnPosts] = useState<OwnPost[]>([]);
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [followerPreviews, setFollowerPreviews] = useState<FollowerPreview[]>([]);

  const loadFollowerPreviews = useCallback(async (profileId: string) => {
    const response = await fetch(`/api/users/${profileId}/followers?page=1&limit=4`);
    const data = await response.json();

    if (response.ok) {
      setFollowerPreviews((data.items ?? []).slice(0, 4) as FollowerPreview[]);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    const token = getClientToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    setError("");

    const response = await fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to load profile.");
      setLoading(false);
      return;
    }

    setProfile(data.user);
    setEmail(data.user.email ?? "");
    setPhoneNumber((data.user.phone_number as string | null) ?? "");
    setBio((data.user.bio as string | null) ?? "");
    setLocation((data.user.location as string | null) ?? "");
    setWebsite((data.user.website as string | null) ?? "");
    void loadFollowerPreviews(data.user.id);
    setLoading(false);
  }, [loadFollowerPreviews, router]);

  const loadOwnPosts = useCallback(async () => {
    const token = getClientToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setLoadingPosts(true);

    const response = await fetch("/api/posts?mine=true&page=1&limit=12", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to load your posts.");
      setLoadingPosts(false);
      return;
    }

    setOwnPosts(data.items ?? []);
    setLoadingPosts(false);
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function refreshAll() {
      if (cancelled) {
        return;
      }

      await Promise.all([loadProfile(), loadOwnPosts()]);
    }

    void refreshAll();

    const onFocus = () => {
      void refreshAll();
    };
    window.addEventListener("focus", onFocus);

    const interval = window.setInterval(() => {
      void refreshAll();
    }, 8000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [loadOwnPosts, loadProfile]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getClientToken();

    if (!token) {
      setError("Login first.");
      return;
    }

    const response = await fetch("/api/users/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        email,
        phone_number: phoneNumber || null,
        bio,
        location,
        website: website || null
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to save profile.");
      return;
    }

    setProfile(data.user);
    setEmail(data.user.email ?? "");
    setPhoneNumber((data.user.phone_number as string | null) ?? "");
    setNotice("Profile updated.");
    void loadOwnPosts();
  }

  async function uploadAvatar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getClientToken();
    const formElement = event.currentTarget;
    const fileInput = formElement.elements.namedItem("file") as HTMLInputElement | null;

    if (!token || !fileInput?.files?.[0]) {
      setError("Choose a file and login first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const response = await fetch("/api/uploads/avatar", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Upload failed.");
      return;
    }

    setProfile((prev) => (prev ? { ...prev, avatar_url: data.avatar_url } : prev));
    setNotice("Avatar uploaded.");
    formElement.reset();
  }

  async function deleteOwnPost(postId: string) {
    const token = getClientToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const response = await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to delete post.");
      return;
    }

    setNotice("Post deleted.");
    void loadOwnPosts();
    void loadProfile();
  }

  return (
    <div className="min-h-screen bg-[#040b14] text-white">
      <NotificationsBell />
      <div className="mx-auto flex max-w-[1400px]">
        <AppSidebar active="profile" />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <SocialLogo href={"/feed" as Route} />
            <Link href={"/feed" as Route} className="rounded-full border border-white/20 px-3 py-1 text-sm text-slate-200">
              Feed
            </Link>
          </div>

          {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
          {notice ? <p className="mb-3 text-sm text-emerald-300">{notice}</p> : null}
          {loading ? <p className="mb-3 text-sm text-slate-300">Loading profile...</p> : null}

          {profile ? (
            <section className="mx-auto max-w-4xl">
              <div className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row">
                <div className="sm:w-52 sm:shrink-0 sm:pl-8">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt="Avatar"
                      width={154}
                      height={154}
                      className="h-32 w-32 rounded-full border border-white/20 object-cover sm:h-[154px] sm:w-[154px]"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/20 bg-white/10 text-4xl font-semibold sm:h-[154px] sm:w-[154px]">
                      {profile.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold">{profile.username}</h1>
                    <button
                      type="button"
                      onClick={() => setIsEditing((prev) => !prev)}
                      className="rounded-lg bg-white/15 px-4 py-2 text-sm font-medium"
                    >
                      {isEditing ? "Close edit" : "Edit profile"}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-5 text-sm sm:text-base">
                    <p><span className="font-semibold">{profile.posts_count}</span> posts</p>
                    <p><span className="font-semibold">{profile.followers_count}</span> followers</p>
                    <p><span className="font-semibold">{profile.following_count}</span> following</p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span className="uppercase tracking-[0.25em]">Followed by</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {followerPreviews.length > 0 ? followerPreviews.map((follower) => (
                        <span key={follower.id} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                          {follower.avatar_url ? (
                            <Image src={follower.avatar_url} alt={follower.username} width={18} height={18} className="h-[18px] w-[18px] rounded-full object-cover" />
                          ) : (
                            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white/10 text-[10px]">{follower.username.slice(0, 1).toUpperCase()}</span>
                          )}
                          <span>{follower.username}</span>
                        </span>
                      )) : (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">sample followers</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-slate-200">
                    <p className="font-semibold text-white">{profile.first_name} {profile.last_name}</p>
                    <p>{profile.bio || "No bio yet."}</p>
                    <p>{profile.location || "No location"}</p>
                    <p className="break-all text-sky-300">{profile.website || "No website"}</p>
                  </div>
                </div>
              </div>

              {isEditing ? (
                <section className="mt-6 grid gap-5 lg:grid-cols-2">
                  <form onSubmit={saveProfile} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-5">
                    <h2 className="text-lg font-semibold">Edit profile</h2>
                    <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white" placeholder="Email" />
                    <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white" placeholder="Phone number" />
                    <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={160} className="h-24 w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white" placeholder="Bio" />
                    <input value={location} onChange={(event) => setLocation(event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white" placeholder="Location" />
                    <input value={website} onChange={(event) => setWebsite(event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white" placeholder="Website" />
                    <button className="w-full rounded-xl bg-[#26457f] px-4 py-2.5 font-medium">Save changes</button>
                  </form>

                  <form onSubmit={uploadAvatar} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <h2 className="text-lg font-semibold">Upload avatar</h2>
                    <p className="mt-2 text-xs text-slate-300">JPEG or PNG, max 2 MB.</p>
                    <input name="file" type="file" accept="image/jpeg,image/png" className="mt-4 w-full text-sm text-slate-200" />
                    <button className="mt-4 w-full rounded-xl border border-white/30 px-4 py-2.5 text-sm font-medium">Upload avatar</button>
                  </form>
                </section>
              ) : null}

              <section className="mt-8 border-t border-white/10 pt-5">
                <h2 className="mb-4 text-center text-sm font-semibold tracking-[0.25em] text-slate-300">POSTS</h2>
                {loadingPosts ? <p className="text-sm text-slate-300">Loading your posts...</p> : null}
                {!loadingPosts && ownPosts.length === 0 ? <p className="text-sm text-slate-300">No posts yet.</p> : null}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ownPosts.map((post) => (
                    <article key={post.id} className="group relative overflow-hidden rounded-lg border border-white/10 bg-black/25">
                      {post.media_url ? (
                        post.media_type === "video" ? (
                          <video controls className="h-72 w-full object-cover">
                            <source src={post.media_url} />
                          </video>
                        ) : (
                          <Image src={post.media_url} alt="Post media" width={420} height={420} className="h-72 w-full object-cover" />
                        )
                      ) : (
                        <div className="flex h-72 items-center justify-center p-4 text-sm text-slate-300">{post.content}</div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-slate-200">
                        <span>{post.like_count} likes</span>
                        <div className="flex gap-2">
                          <Link href={`/posts/${post.id}` as Route} className="rounded-md border border-white/25 px-2 py-1">
                            Open
                          </Link>
                          <button type="button" onClick={() => deleteOwnPost(post.id)} className="rounded-md border border-rose-300/50 px-2 py-1 text-rose-200">
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          ) : null}
        </main>
      </div>

      <div className="pb-20 lg:hidden">
        <MobileBottomNav active="profile" />
      </div>
    </div>
  );
}
