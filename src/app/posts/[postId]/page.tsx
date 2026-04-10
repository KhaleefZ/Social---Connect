"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { getClientToken } from "@/lib/client-auth";

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

type Comment = {
  id: string;
  author_id: string;
  author_username?: string;
  content: string;
  created_at: string;
};

export default function PostDetailsPage() {
  const router = useRouter();
  const params = useParams<{ postId: string }>();
  const postId = params.postId;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPostAndComments = useCallback(async () => {
    setLoading(true);
    setError("");

    const postResponse = await fetch(`/api/posts/${postId}`);
    const postData = await postResponse.json();

    if (!postResponse.ok) {
      setError(postData.error ?? "Unable to load post.");
      setLoading(false);
      return;
    }

    setPost(postData.post);

    const commentResponse = await fetch(`/api/posts/${postId}/comments`);
    const commentData = await commentResponse.json();

    if (!commentResponse.ok) {
      setError(commentData.error ?? "Unable to load comments.");
      setLoading(false);
      return;
    }

    setComments(commentData.items ?? []);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPostAndComments();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadPostAndComments]);

  async function likePost() {
    const token = getClientToken();

    if (!token) {
      router.replace("/");
      return;
    }

    await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    void loadPostAndComments();
  }

  async function unlikePost() {
    const token = getClientToken();

    if (!token) {
      router.replace("/");
      return;
    }

    await fetch(`/api/posts/${postId}/like`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    void loadPostAndComments();
  }

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getClientToken();

    if (!token) {
      router.replace("/");
      return;
    }
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content: commentInput })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to add comment.");
      return;
    }

    setCommentInput("");
    setComments((prev) => [data.comment, ...prev]);
    setPost((prev) => (prev ? { ...prev, comment_count: prev.comment_count + 1 } : prev));
  }

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-3xl font-semibold text-white">View single post</h1>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {loading ? <p className="text-sm text-slate-300">Loading post...</p> : null}

        {post ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
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
              <p>@{post.author_username}</p>
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
                  alt="Post image"
                  width={800}
                  height={400}
                  className="mt-3 max-h-80 rounded-xl object-cover"
                />
              )
            ) : null}
            <div className="mt-4 flex items-center gap-3 text-sm text-slate-300">
              <span>{post.like_count} likes</span>
              <span>{post.comment_count} comments</span>
              <button type="button" onClick={likePost} className="rounded-full border border-white/20 px-3 py-1">
                Like
              </button>
              <button type="button" onClick={unlikePost} className="rounded-full border border-white/20 px-3 py-1">
                Unlike
              </button>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold text-white">Comments</h2>
          <form onSubmit={addComment} className="mt-4 flex gap-3">
            <input
              required
              value={commentInput}
              onChange={(event) => setCommentInput(event.target.value)}
              maxLength={280}
              className="flex-1 rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white"
              placeholder="Add comment"
            />
            <button className="rounded-xl bg-accent px-4 py-2 font-medium text-accent-foreground">Add</button>
          </form>
          <div className="mt-4 space-y-3">
            {comments.map((comment) => (
              <article key={comment.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-slate-300">@{comment.author_username ?? "unknown"}</p>
                <p className="mt-1 text-sm text-white">{comment.content}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}