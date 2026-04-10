import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/current-user";
import { jsonError, jsonSuccess } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { messageInputSchema, userIdParamsSchema } from "@/lib/validators/social";

type RouteParams = {
  params: Promise<{ userId: string }>;
};

async function canUsersMessage(userId: string, targetUserId: string) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("follows")
    .select("id")
    .or(
      `and(follower_id.eq.${userId},following_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},following_id.eq.${userId})`
    )
    .limit(1);

  if (error) {
    return { allowed: false, error: error.message };
  }

  return { allowed: (data ?? []).length > 0 };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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
    return jsonError("Select another user to open chat.", 422);
  }

  const permission = await canUsersMessage(auth.user.userId, userId);

  if (permission.error) {
    return jsonError(permission.error, 500);
  }

  if (!permission.allowed) {
    return jsonError("Messaging is available only between connected followers.", 403);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id,sender_id,recipient_id,content,created_at")
    .or(
      `and(sender_id.eq.${auth.user.userId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${auth.user.userId})`
    )
    .order("created_at", { ascending: true })
    .limit(300);

  if (error) {
    if (error.message.toLowerCase().includes("messages")) {
      return jsonError("Messages table is missing. Run the latest SQL migration.", 500);
    }

    return jsonError(error.message, 500);
  }

  return jsonSuccess({ items: data ?? [] });
}

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
    return jsonError("Cannot message yourself.", 422);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid JSON payload.");
  }

  const parsed = messageInputSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError("Validation failed.", 422, parsed.error.flatten());
  }

  const permission = await canUsersMessage(auth.user.userId, userId);

  if (permission.error) {
    return jsonError(permission.error, 500);
  }

  if (!permission.allowed) {
    return jsonError("Messaging is available only between connected followers.", 403);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: auth.user.userId,
      recipient_id: userId,
      content: parsed.data.content
    })
    .select("id,sender_id,recipient_id,content,created_at")
    .single();

  if (error || !data) {
    if (error?.message.toLowerCase().includes("messages")) {
      return jsonError("Messages table is missing. Run the latest SQL migration.", 500);
    }

    return jsonError(error?.message ?? "Unable to send message.", 500);
  }

  return jsonSuccess({ message: data }, { status: 201 });
}
