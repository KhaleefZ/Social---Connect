import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/current-user";
import { jsonError, jsonSuccess } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { userIdParamsSchema } from "@/lib/validators/social";

type RouteParams = {
  params: Promise<{ userId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuthenticatedUser(request);

  if (!auth.user) {
    return jsonError(auth.error, auth.status);
  }

  const parsedParams = userIdParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return jsonError("Invalid user id.", 422, parsedParams.error.flatten());
  }

  const { userId } = parsedParams.data;

  if (userId === auth.user.userId) {
    return jsonError("You cannot follow yourself.", 422);
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("follows").insert({
    follower_id: auth.user.userId,
    following_id: userId
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

  const parsedParams = userIdParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return jsonError("Invalid user id.", 422, parsedParams.error.flatten());
  }

  const { userId } = parsedParams.data;
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", auth.user.userId)
    .eq("following_id", userId);

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonSuccess({ ok: true });
}