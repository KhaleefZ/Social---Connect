import { NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/auth";
import { getBearerToken } from "@/lib/request";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/http";
import { createPostSchema } from "@/lib/validators/post";
import { paginationSchema } from "@/lib/validators/social";
import { enrichPostsWithAuthors } from "@/lib/posts";
import { loadPost } from "@/lib/posts";

function isMissingMediaColumnError(message?: string) {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();
  return normalized.includes("media_url") || normalized.includes("media_type");
}

export async function GET(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = paginationSchema.safeParse(searchParams);

  if (!parsed.success) {
    return jsonError("Invalid pagination parameters.", 422, parsed.error.flatten());
  }

  const { page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const mineOnly = request.nextUrl.searchParams.get("mine") === "true";

  let authUserId: string | null = null;

  if (mineOnly) {
    const token = getBearerToken(request);

    if (!token) {
      return jsonError("Authorization token is required.", 401);
    }

    try {
      const payload = await verifyAuthToken(token);
      authUserId = payload.userId;
    } catch {
      return jsonError("Invalid token.", 401);
    }
  }

  let queryBuilder = supabase
    .from("posts")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (mineOnly && authUserId) {
    queryBuilder = queryBuilder.eq("author_id", authUserId);
  }

  const { data, error, count } = await queryBuilder;

  if (error) {
    return jsonError(error.message, 500);
  }

  const items = await enrichPostsWithAuthors((data ?? []) as Array<{
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
  }>);

  return jsonSuccess({
    items,
    page,
    limit,
    total: count ?? 0
  });
}

export async function POST(request: NextRequest) {
  const token = getBearerToken(request);

  if (!token) {
    return jsonError("Authorization token is required.", 401);
  }

  let payload;

  try {
    payload = await verifyAuthToken(token);
  } catch {
    return jsonError("Invalid token.", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON payload.");
  }

  const parsed = createPostSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Validation failed.", 422, parsed.error.flatten());
  }

  const supabase = createSupabaseAdminClient();
  const insertPayload: {
    author_id: string;
    content: string;
    media_url?: string | null;
    media_type?: "image" | "video" | null;
  } = {
    author_id: payload.userId,
    content: parsed.data.content,
    media_url: parsed.data.media_url ?? null,
    media_type: parsed.data.media_type ?? null
  };

  let { data, error } = await supabase
    .from("posts")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error && isMissingMediaColumnError(error.message)) {
    const fallbackPayload = {
      author_id: payload.userId,
      content: parsed.data.content
    };

    const fallbackResult = await supabase
      .from("posts")
      .insert(fallbackPayload)
      .select("*")
      .single();

    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error || !data) {
    const message = error?.message ?? "Unable to create post.";

    if (isMissingMediaColumnError(message)) {
      return jsonError("Database is missing media columns. Run the latest SQL migration and refresh Supabase schema cache.", 500);
    }

    return jsonError(message, 500);
  }

  const post = await loadPost(data.id);

  return jsonSuccess({ post }, { status: 201 });
}