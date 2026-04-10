"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera, Heart, ImagePlus, MessageCircle, Sparkles, Upload, UserRound, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getClientToken } from "@/lib/client-auth";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SocialLogo } from "@/components/social-logo";
import { NotificationsBell } from "@/components/notifications-bell";

type Post = {
  id: string;
  author_id: string;
  author_username: string;
  author_avatar_url: string | null;
  content: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  like_count: number;
  comment_count: number;
  created_at: string;
};

type SuggestedUser = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type MeProfile = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
};

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [meProfile, setMeProfile] = useState<MeProfile | null>(null);
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [posting, setPosting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const postPrompts = useMemo(
    () => ["Morning recap", "What I’m building", "Weekend highlights", "A moment worth saving"],
    []
  );

  const loadFeed = useCallback(async () => {
    const token = getClientToken();

    if (!token) {
      router.replace("/");
      return;
    }
    setLoadingFeed(true);
    setError("");

    const response = await fetch("/api/feed", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to load feed.");
      setLoadingFeed(false);
      return;
    }

    setPosts(data.items ?? []);
    setLoadingFeed(false);
  }, [router]);

  const loadSuggestions = useCallback(async () => {
    const token = getClientToken();

    if (!token) {
      return;
    }

    const [meResponse, usersResponse] = await Promise.all([
      fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch("/api/users?page=1&limit=12")
    ]);

    const meData = await meResponse.json();
    const usersData = await usersResponse.json();

    if (!meResponse.ok || !usersResponse.ok) {
      return;
    }

    setMeProfile(meData.user as MeProfile);
    const meId = meData?.user?.id as string | undefined;
    const items = (usersData.items ?? []) as SuggestedUser[];
    setSuggestedUsers(items.filter((item) => item.id !== meId).slice(0, 5));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFeed();
      void loadSuggestions();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadFeed, loadSuggestions]);

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getClientToken();

    if (!token) {
      setError("Login first.");
      return;
    }

    setPosting(true);

    let mediaUrl: string | null = null;
    let mediaType: "image" | "video" | null = null;

    if (mediaFile) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", mediaFile);

      const uploadResponse = await fetch("/api/uploads/post-media", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        setError(uploadData.error ?? "Unable to upload media.");
        setPosting(false);
        return;
      }

      mediaUrl = uploadData.media_url;
      mediaType = uploadData.media_type;
    }

    const response = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content, media_url: mediaUrl, media_type: mediaType })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to create post.");
      setPosting(false);
      return;
    }

    setContent("");
    setMediaFile(null);
    setMediaPreview(null);
    setPosts((prev) => [data.post, ...prev]);
    setPosting(false);
  }

  function handleMediaChange(file: File | null) {
    if (mediaPreview) {
      window.URL.revokeObjectURL(mediaPreview);
    }

    if (!file) {
      setMediaFile(null);
      setMediaPreview(null);
      return;
    }

    setMediaFile(file);
    setMediaPreview(window.URL.createObjectURL(file));
  }

  function clearMediaSelection() {
    if (mediaPreview) {
      window.URL.revokeObjectURL(mediaPreview);
    }

    setMediaFile(null);
    setMediaPreview(null);
  }

  async function likePost(postId: string) {
    const token = getClientToken();

    if (!token) {
      setError("Login first.");
      return;
    }

    await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    void loadFeed();
  }

  const stories = Array.from(new Map(posts.map((post) => [post.author_id, post])).values()).slice(0, 8);
  const mediaPosts = posts.filter((post) => post.media_url);
  const lightboxPost = lightboxIndex !== null ? mediaPosts[lightboxIndex] ?? null : null;

  return (
    <div className="min-h-screen bg-[#040b14] text-white">
      <NotificationsBell />
      <div className="flex w-full">
        <AppSidebar active="feed" />

        <main className="min-w-0 w-full flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:px-4 lg:py-5">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <SocialLogo href={"/feed" as Route} />
            <Link href={"/me" as Route} className="rounded-full border border-white/20 px-3 py-1 text-sm text-slate-200">
              Profile
            </Link>
          </div>

          {stories.length > 0 ? (
            <section className="mb-5 flex gap-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-4">
              {stories.map((story) => (
                <Link key={story.author_id} href={`/users/${story.author_id}` as Route} className="shrink-0 text-center">
                  <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-[2px]">
                    <div className="rounded-full bg-[#040b14] p-[2px]">
                      {story.author_avatar_url ? (
                        <Image
                          src={story.author_avatar_url}
                          alt={story.author_username}
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-base font-semibold">
                          {story.author_username.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 max-w-14 truncate text-xs text-slate-300">{story.author_username}</p>
                </Link>
              ))}
            </section>
          ) : null}

          {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
          {loadingFeed ? <p className="mb-3 text-sm text-slate-300">Loading feed...</p> : null}

          <section className="space-y-5">
            {posts.map((post) => (
              <article key={post.id} className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                  {post.author_avatar_url ? (
                    <Image
                      src={post.author_avatar_url}
                      alt={post.author_username}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/20 text-xs font-semibold text-white">
                      {post.author_username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                    <p className="text-sm text-slate-300">@{post.author_username}</p>
                  </div>
                  <Link href={`/users/${post.author_id}` as Route} className="text-xs text-slate-400 hover:text-slate-200">
                    View profile
                  </Link>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-white">{post.content}</p>
                {post.media_url ? (
                  post.media_type === "video" ? (
                    <button type="button" onClick={() => setLightboxIndex(Math.max(mediaPosts.findIndex((item) => item.id === post.id), 0))} className="mt-3 block w-full overflow-hidden rounded-xl border border-white/10">
                      <video controls className="w-full rounded-xl">
                        <source src={post.media_url} />
                      </video>
                    </button>
                  ) : (
                    <button type="button" onClick={() => setLightboxIndex(Math.max(mediaPosts.findIndex((item) => item.id === post.id), 0))} className="mt-3 block w-full overflow-hidden rounded-xl">
                      <Image
                        src={post.media_url}
                        alt="Post media"
                        width={720}
                        height={520}
                        className="max-h-[560px] w-full rounded-xl object-cover transition duration-300 hover:scale-[1.02]"
                      />
                    </button>
                  )
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                  <span>{post.like_count} likes</span>
                  <span>{post.comment_count} comments</span>
                  <button
                    type="button"
                    onClick={() => likePost(post.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 transition hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    <Heart size={14} /> Like
                  </button>
                  <Link
                    href={`/posts/${post.id}` as Route}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 transition hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    <MessageCircle size={14} /> View post
                  </Link>
                </div>
              </article>
            ))}
          </section>
        </main>

        <aside className="hidden w-[350px] shrink-0 border-l border-white/10 p-6 xl:block">
          {meProfile ? (
            <Link href="/me" className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              {meProfile.avatar_url ? (
                <Image src={meProfile.avatar_url} alt={meProfile.username} width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-sm font-semibold">
                  {meProfile.username.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm text-slate-400">My profile</p>
                <p className="text-sm font-semibold text-white">{meProfile.username}</p>
                <p className="text-xs text-slate-300">{meProfile.first_name} {meProfile.last_name}</p>
              </div>
            </Link>
          ) : null}

          <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-400/10 via-transparent to-emerald-300/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-200">
                  <Sparkles size={12} /> Quick share
                </div>
                <h2 className="mt-2 text-sm font-semibold text-white">Create post</h2>
                <p className="mt-1 text-xs text-slate-300">A compact studio for thoughts, photos, and short clips.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-2 text-slate-300">
                <Camera size={16} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {postPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setContent((prev) => (prev ? `${prev}\n\n${prompt}` : prompt))}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-slate-200 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={createPost} className="mt-3 space-y-3">
              <textarea
                required
                maxLength={280}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Share something..."
                className="h-28 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/40 focus:bg-slate-950/80"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <ImagePlus size={12} /> Tip: add location and moments that matter.
                </span>
                <span className={content.length > 240 ? "text-amber-300" : ""}>{content.length}/280</span>
              </div>

              <label className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-4 transition hover:border-sky-400/40 hover:bg-white/5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/20 to-emerald-300/20 text-sky-100 transition group-hover:scale-105">
                  <Upload size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">Add photo or video</p>
                  <p className="truncate text-xs text-slate-400">JPEG, PNG, MP4, or WEBM. Tap to pick a file.</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,video/mp4,video/webm"
                  onChange={(event) => handleMediaChange(event.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>

              {mediaFile ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-slate-400">
                    <span>Preview</span>
                    <button type="button" onClick={clearMediaSelection} className="text-slate-300 transition hover:text-white">
                      Remove
                    </button>
                  </div>
                  <div className="p-3">
                    {mediaPreview ? (
                      mediaFile.type.startsWith("video/") ? (
                        <video controls className="max-h-56 w-full rounded-xl object-cover">
                          <source src={mediaPreview} />
                        </video>
                      ) : (
                        <Image
                          src={mediaPreview}
                          alt={mediaFile.name}
                          width={1200}
                          height={900}
                          className="max-h-56 w-full rounded-xl object-cover"
                        />
                      )
                    ) : null}
                    <p className="mt-2 truncate text-xs text-slate-300">{mediaFile.name}</p>
                  </div>
                </div>
              ) : null}

              <button
                disabled={posting}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#2e4f97] via-[#3a6ac8] to-[#25a3d8] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(45,88,164,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />
                <span className="relative">{posting ? "Posting..." : "Post to feed"}</span>
              </button>
            </form>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Suggested for you</h3>
              <span className="text-xs text-slate-400">See all</span>
            </div>
            <div className="mt-4 space-y-4">
              {suggestedUsers.map((user) => (
                <Link key={user.id} href={`/users/${user.id}` as Route} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <Image src={user.avatar_url} alt={user.username} width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-xs text-white">
                        {user.username.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <p className="text-sm text-slate-200">{user.username}</p>
                  </div>
                  <span className="text-sm font-medium text-[#60a5fa]">Follow</span>
                </Link>
              ))}
              {suggestedUsers.length === 0 ? <p className="text-xs text-slate-400">No suggestions yet.</p> : null}
            </div>
          </section>
        </aside>
      </div>

      {lightboxPost ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setLightboxIndex(null)}>
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setLightboxIndex(null)} className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white">
              <X size={18} />
            </button>
            <div className="grid min-h-[70vh] place-items-center bg-black">
              {lightboxPost.media_type === "video" ? (
                <video controls autoPlay className="max-h-[80vh] w-full">
                  <source src={lightboxPost.media_url ?? ""} />
                </video>
              ) : (
                <Image src={lightboxPost.media_url ?? ""} alt={lightboxPost.author_username} width={1600} height={1200} className="max-h-[80vh] w-full object-contain transition duration-300" />
              )}
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm text-slate-200">
              <button type="button" disabled={lightboxIndex === 0} onClick={() => setLightboxIndex((prev) => (prev === null ? null : Math.max(prev - 1, 0)))} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 disabled:opacity-40">
                <ArrowLeft size={14} /> Prev
              </button>
              <p className="truncate">@{lightboxPost.author_username}</p>
              <button type="button" disabled={lightboxIndex === mediaPosts.length - 1} onClick={() => setLightboxIndex((prev) => (prev === null ? null : Math.min(prev + 1, mediaPosts.length - 1)))} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 disabled:opacity-40">
                Next <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="pb-20 lg:hidden">
        <MobileBottomNav active="feed" />
      </div>
    </div>
  );
}