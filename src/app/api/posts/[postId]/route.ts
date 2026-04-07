import { NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/auth";
import { getBearerToken } from "@/lib/request";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/http";
import { loadPost } from "@/lib/posts";
import { updatePostSchema } from "@/lib/validators/post";
import { postIdParamsSchema } from "@/lib/validators/social";

type RouteParams = {
  params: Promise<{ postId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const parsedParams = postIdParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return jsonError("Invalid post id.", 422, parsedParams.error.flatten());
  }

  const { postId } = parsedParams.data;
  const post = await loadPost(postId);

  if (!post || !post.is_active) {
    return jsonError("Post not found.", 404);
  }

  return jsonSuccess({ post });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  const parsedParams = postIdParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return jsonError("Invalid post id.", 422, parsedParams.error.flatten());
  }

  const { postId } = parsedParams.data;
  const current = await loadPost(postId);

  if (!current || !current.is_active) {
    return jsonError("Post not found.", 404);
  }

  if (current.author_id !== payload.userId) {
    return jsonError("You can only update your own posts.", 403);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON payload.");
  }

  const parsed = updatePostSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Validation failed.", 422, parsed.error.flatten());
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("posts")
    .update(parsed.data)
    .eq("id", postId);

  if (error) {
    return jsonError(error?.message ?? "Unable to update post.", 500);
  }

  const post = await loadPost(postId);

  return jsonSuccess({ post });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

  const parsedParams = postIdParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return jsonError("Invalid post id.", 422, parsedParams.error.flatten());
  }

  const { postId } = parsedParams.data;
  const current = await loadPost(postId);

  if (!current || !current.is_active) {
    return jsonError("Post not found.", 404);
  }

  if (current.author_id !== payload.userId) {
    return jsonError("You can only delete your own posts.", 403);
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("posts")
    .update({ is_active: false })
    .eq("id", postId);

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonSuccess({ ok: true });
}