import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/current-user";
import { jsonError, jsonSuccess } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { postCommentParamsSchema } from "@/lib/validators/social";

type RouteParams = {
  params: Promise<{ postId: string; commentId: string }>;
};

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuthenticatedUser(request);

  if (!auth.user) {
    return jsonError(auth.error, auth.status);
  }

  const parsedParams = postCommentParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return jsonError("Invalid post or comment id.", 422, parsedParams.error.flatten());
  }

  const { postId, commentId } = parsedParams.data;
  const supabase = createSupabaseAdminClient();

  const { data: comment, error: lookupError } = await supabase
    .from("comments")
    .select("id,author_id,is_active")
    .eq("id", commentId)
    .eq("post_id", postId)
    .maybeSingle();

  if (lookupError) {
    return jsonError(lookupError.message, 500);
  }

  if (!comment || !comment.is_active) {
    return jsonError("Comment not found.", 404);
  }

  if (comment.author_id !== auth.user.userId) {
    return jsonError("You can only delete your own comments.", 403);
  }

  const { error } = await supabase
    .from("comments")
    .update({ is_active: false })
    .eq("id", commentId)
    .eq("post_id", postId);

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonSuccess({ ok: true });
}