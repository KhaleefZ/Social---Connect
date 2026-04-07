"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { getClientToken } from "@/lib/client-auth";

type Profile = {
  id: string;
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

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to load profile.");
      setLoading(false);
      return;
    }

    setProfile(data.user);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadProfile]);

  async function followUser() {
    const token = getClientToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const response = await fetch(`/api/users/${userId}/follow`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to follow user.");
      return;
    }

    void loadProfile();
  }

  async function unfollowUser() {
    const token = getClientToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const response = await fetch(`/api/users/${userId}/follow`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to unfollow user.");
      return;
    }

    void loadProfile();
  }

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-3xl font-semibold text-white">View profile</h1>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {loading ? <p className="text-sm text-slate-300">Loading profile...</p> : null}

        {profile ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="User avatar"
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

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
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

            <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-200">
              <p>{profile.bio || "No bio yet."}</p>
              <p className="mt-2">{profile.location || "No location"}</p>
              <p className="mt-2 break-all">{profile.website || "No website"}</p>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={followUser}
                className="rounded-xl bg-accent px-4 py-2 font-medium text-accent-foreground"
              >
                Follow
              </button>
              <button
                type="button"
                onClick={unfollowUser}
                className="rounded-xl border border-white/20 px-4 py-2 text-white"
              >
                Unfollow
              </button>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}