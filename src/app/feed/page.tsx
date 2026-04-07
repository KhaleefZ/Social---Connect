"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, UserRound } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { getClientToken } from "@/lib/client-auth";
import { TopNav } from "@/components/top-nav";

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

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [posting, setPosting] = useState(false);

  const loadFeed = useCallback(async () => {
    const token = getClientToken();

    if (!token) {
      router.replace("/login");
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFeed();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadFeed]);

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
    setPosts((prev) => [data.post, ...prev]);
    setPosting(false);
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

  return (
    <div>
      <TopNav />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <section className="min-w-0">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h1 className="text-3xl font-semibold text-white">Your feed</h1>
            <p className="mt-2 text-sm text-slate-300">Chronological posts from people you follow.</p>
          </div>
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
          {loadingFeed ? <p className="mt-4 text-sm text-slate-300">Loading feed...</p> : null}
          {!loadingFeed && posts.length === 0 ? (
            <p className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
              No posts yet. Create your first post from the panel on the right.
            </p>
          ) : null}
          <div className="mt-5 space-y-4">
            {posts.map((post) => (
              <article key={post.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
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
                  <Link
                    href={`/users/${post.author_id}` as Route}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 transition hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    <UserRound size={14} /> View profile
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-white/10 bg-white/5 p-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-white">Create post</h2>
          <p className="mt-1 text-xs text-slate-300">Add a photo or video if you want. Photos and videos are uploaded to storage first.</p>
          <form onSubmit={createPost} className="mt-4 space-y-3">
            <textarea
              required
              maxLength={280}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="What do you want to share?"
              className="h-36 w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white"
            />
            <input
              type="file"
              accept="image/jpeg,image/png,video/mp4,video/webm"
              onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-300"
            />
            {mediaFile ? <p className="text-xs text-slate-300">Selected: {mediaFile.name}</p> : null}
            <button
              disabled={posting}
              className="w-full rounded-xl bg-accent px-4 py-2.5 font-medium text-accent-foreground transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              void loadFeed();
            }}
            className="mt-3 w-full rounded-xl border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Refresh feed
          </button>
        </aside>
      </main>
    </div>
  );
}