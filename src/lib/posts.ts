import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type PublicPost = {
  id: string;
  author_id: string;
  author_username: string;
  author_avatar_url: string | null;
  content: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  is_active: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
};

type RawPost = {
  id: string;
  author_id: string;
  content: string;
  media_url?: string | null;
  media_type?: "image" | "video" | null;
  is_active: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
};

type AuthorSummary = {
  id: string;
  username: string;
  avatar_url: string | null;
};

async function loadAuthorSummaries(authorIds: string[]) {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("users")
    .select("id,username,avatar_url")
    .in("id", authorIds);

  const summaries = new Map<string, AuthorSummary>();

  (data ?? []).forEach((author) => {
    summaries.set(author.id, author as AuthorSummary);
  });

  return summaries;
}

function normalizePost(raw: RawPost): PublicPost {
  return {
    id: raw.id,
    author_id: raw.author_id,
    author_username: "unknown",
    author_avatar_url: null,
    content: raw.content,
    media_url: raw.media_url ?? null,
    media_type: raw.media_type ?? null,
    is_active: raw.is_active,
    like_count: raw.like_count,
    comment_count: raw.comment_count,
    created_at: raw.created_at,
    updated_at: raw.updated_at
  };
}

export async function enrichPostsWithAuthors(posts: RawPost[]) {
  if (posts.length === 0) {
    return [];
  }

  const authorMap = await loadAuthorSummaries([...new Set(posts.map((post) => post.author_id))]);

  return posts.map((post) => {
    const normalized = normalizePost(post);
    const author = authorMap.get(post.author_id);

    return {
      ...normalized,
      author_username: author?.username ?? "unknown",
      author_avatar_url: author?.avatar_url ?? null
    };
  });
}

export async function loadPost(postId: string): Promise<PublicPost | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const enriched = await enrichPostsWithAuthors([data as RawPost]);

  return enriched[0] ?? null;
}