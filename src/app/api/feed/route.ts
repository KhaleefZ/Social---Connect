import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/current-user";
import { jsonError, jsonSuccess } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { paginationSchema } from "@/lib/validators/social";
import { enrichPostsWithAuthors } from "@/lib/posts";

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request);

  if (!auth.user) {
    return jsonError(auth.error, auth.status);
  }

  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = paginationSchema.safeParse(query);

  if (!parsed.success) {
    return jsonError("Invalid pagination parameters.", 422, parsed.error.flatten());
  }

  const { page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const supabase = createSupabaseAdminClient();

  const { data: followingRows, error: followingError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", auth.user.userId);

  if (followingError) {
    return jsonError(followingError.message, 500);
  }

  const followingIds = Array.from(new Set([auth.user.userId, ...(followingRows ?? []).map((row) => row.following_id)]));

  if (followingIds.length === 0) {
    return jsonSuccess({ items: [], page, limit, total: 0 });
  }

  const { data, error, count } = await supabase
    .from("posts")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .in("author_id", followingIds)
    .order("created_at", { ascending: false })
    .range(from, to);

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