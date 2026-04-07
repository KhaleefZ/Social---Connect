import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/current-user";
import { jsonError, jsonSuccess } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { loadPost } from "@/lib/posts";
import { createCommentSchema } from "@/lib/validators/comment";
import { paginationSchema, postIdParamsSchema } from "@/lib/validators/social";

type RouteParams = {
  params: Promise<{ postId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const parsedParams = postIdParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return jsonError("Invalid post id.", 422, parsedParams.error.flatten());
  }

  const { postId } = parsedParams.data;
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = paginationSchema.safeParse(query);

  if (!parsed.success) {
    return jsonError("Invalid pagination parameters.", 422, parsed.error.flatten());
  }

  const post = await loadPost(postId);

  if (!post || !post.is_active) {
    return jsonError("Post not found.", 404);
  }

  const { page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const supabase = createSupabaseAdminClient();

  const { data, error, count } = await supabase
    .from("comments")
    .select("id,post_id,author_id,content,is_active,created_at,updated_at", { count: "exact" })
    .eq("post_id", postId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonSuccess({
    items: data ?? [],
    page,
    limit,
    total: count ?? 0
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuthenticatedUser(request);

  if (!auth.user) {
    return jsonError(auth.error, auth.status);
  }

  const parsedParams = postIdParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return jsonError("Invalid post id.", 422, parsedParams.error.flatten());
  }

  const { postId } = parsedParams.data;
  const post = await loadPost(postId);

  if (!post || !post.is_active) {
    return jsonError("Post not found.", 404);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON payload.");
  }

  const parsed = createCommentSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Validation failed.", 422, parsed.error.flatten());
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: auth.user.userId,
      content: parsed.data.content
    })
    .select("id,post_id,author_id,content,is_active,created_at,updated_at")
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? "Unable to add comment.", 500);
  }

  return jsonSuccess({ comment: data }, { status: 201 });
}