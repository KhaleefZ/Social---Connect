import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/current-user";
import { jsonError, jsonSuccess } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { loadPost } from "@/lib/posts";
import { postIdParamsSchema } from "@/lib/validators/social";

type RouteParams = {
  params: Promise<{ postId: string }>;
};

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

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("likes").insert({
    post_id: postId,
    user_id: auth.user.userId
  });

  if (error && error.code !== "23505") {
    return jsonError(error.message, 500);
  }

  return jsonSuccess({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuthenticatedUser(request);

  if (!auth.user) {
    return jsonError(auth.error, auth.status);
  }

  const parsedParams = postIdParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return jsonError("Invalid post id.", 422, parsedParams.error.flatten());
  }

  const { postId } = parsedParams.data;
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", auth.user.userId);

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonSuccess({ ok: true });
}