"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { getClientToken } from "@/lib/client-auth";
import { TopNav } from "@/components/top-nav";

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
    setLoading(false);
  }, [router]);

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
    const timer = window.setTimeout(() => {
      void loadProfile();
      void loadOwnPosts();
    }, 0);

    return () => {
      window.clearTimeout(timer);
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
    <div>
      <TopNav />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 lg:sticky lg:top-24 lg:h-fit">
          <h1 className="text-2xl font-semibold text-white">My profile</h1>
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
          {notice ? <p className="mt-3 text-sm text-emerald-300">{notice}</p> : null}
          {loading ? <p className="mt-3 text-sm text-slate-300">Loading profile...</p> : null}

          {profile ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-4">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="Avatar"
                    width={74}
                    height={74}
                    className="h-[74px] w-[74px] rounded-full border-2 border-emerald-300/70 object-cover"
                  />
                ) : (
                  <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full border-2 border-emerald-300/70 bg-emerald-300/10 text-xl font-semibold text-emerald-200">
                    {profile.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-white">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <p className="text-sm text-slate-300">@{profile.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2">
                  <p className="font-semibold text-white">{profile.posts_count}</p>
                  <p className="text-slate-300">Posts</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2">
                  <p className="font-semibold text-white">{profile.followers_count}</p>
                  <p className="text-slate-300">Followers</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2">
                  <p className="font-semibold text-white">{profile.following_count}</p>
                  <p className="text-slate-300">Following</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-200">
                <p>{profile.bio || "No bio yet."}</p>
                <p className="mt-2">{profile.location || "No location"}</p>
                <p className="mt-2 break-all">{profile.website || "No website"}</p>
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white">Profile actions</h2>
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="mt-3 w-full rounded-xl border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10"
            >
              {isEditing ? "Close edit profile" : "Open edit profile"}
            </button>
          </div>

          {isEditing ? (
            <>
              <form onSubmit={saveProfile} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-white">Edit profile</h2>
                <div className="space-y-2 text-sm text-slate-300">
                  <label className="block">Email</label>
                  <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white transition focus:border-emerald-300/50" placeholder="Email" />
                </div>
                <div className="space-y-2 text-sm text-slate-300">
                  <label className="block">Phone number</label>
                  <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white transition focus:border-emerald-300/50" placeholder="Phone number" />
                </div>
                <div className="space-y-2 text-sm text-slate-300">
                  <label className="block">Bio</label>
                  <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={160} className="h-24 w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white transition focus:border-emerald-300/50" placeholder="Bio" />
                </div>
                <div className="space-y-2 text-sm text-slate-300">
                  <label className="block">Location</label>
                  <input value={location} onChange={(event) => setLocation(event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white transition focus:border-emerald-300/50" placeholder="Location" />
                </div>
                <div className="space-y-2 text-sm text-slate-300">
                  <label className="block">Website</label>
                  <input value={website} onChange={(event) => setWebsite(event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white transition focus:border-emerald-300/50" placeholder="Website (https://...)" />
                </div>
                <button className="w-full rounded-xl bg-accent px-4 py-2.5 font-medium text-accent-foreground transition hover:-translate-y-0.5">Save</button>
              </form>

              <form onSubmit={uploadAvatar} className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-white">Upload avatar</h2>
                <p className="mt-2 text-xs text-slate-300">JPEG or PNG, max 2 MB.</p>
                <input name="file" type="file" accept="image/jpeg,image/png" className="mt-3 w-full text-sm text-slate-200" />
                <button className="mt-3 w-full rounded-xl bg-white px-4 py-2.5 font-medium text-slate-900 transition hover:-translate-y-0.5">Upload</button>
              </form>
            </>
          ) : null}

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white">Your posts</h2>
            {loadingPosts ? <p className="mt-3 text-sm text-slate-300">Loading your posts...</p> : null}
            {!loadingPosts && ownPosts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-300">No posts yet. Create one from the feed screen.</p>
            ) : null}
            <div className="mt-4 space-y-4">
              {ownPosts.map((post) => (
                <article key={post.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-slate-300">@{post.author_username}</p>
                  <p className="mt-2 whitespace-pre-wrap text-white">{post.content}</p>
                  {post.media_url ? (
                    post.media_type === "video" ? (
                      <video controls className="mt-3 w-full rounded-xl border border-white/10">
                        <source src={post.media_url} />
                      </video>
                    ) : (
                      <Image
                        src={post.media_url}
                        alt="Post media"
                        width={720}
                        height={320}
                        className="mt-3 max-h-72 rounded-xl object-cover"
                      />
                    )
                  ) : null}
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-300">
                    <span>{post.like_count} likes · {post.comment_count} comments</span>
                    <div className="flex gap-2">
                      <Link href={`/posts/${post.id}` as Route} className="rounded-full border border-white/20 px-3 py-1 text-white transition hover:bg-white/10">
                        Open
                      </Link>
                      <button type="button" onClick={() => deleteOwnPost(post.id)} className="rounded-full border border-rose-300/40 px-3 py-1 text-rose-200 transition hover:bg-rose-300/10">
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
