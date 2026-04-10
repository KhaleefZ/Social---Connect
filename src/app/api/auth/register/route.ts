import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hashPassword, signAuthToken } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/http";
import { registerSchema } from "@/lib/validators/auth";
import { sendRegistrationEmail } from "@/lib/mailer";
import { env } from "@/lib/env";

async function loadProfileStats(supabase: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  const [posts, followers, following] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", userId).eq("is_active", true),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId)
  ]);

  return {
    posts_count: posts.count ?? 0,
    followers_count: followers.count ?? 0,
    following_count: following.count ?? 0
  };
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid JSON payload.");
  }

  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError("Validation failed.", 422, parsed.error.flatten());
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      email: parsed.data.email.toLowerCase(),
      username: parsed.data.username,
      password_hash: passwordHash,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name
    })
    .select("id,email,username,first_name,last_name,bio,avatar_url,website,location,last_login,created_at,updated_at")
    .single();

  if (error || !user) {
    const message = error?.message ?? "Unable to create account.";

    return jsonError(message.includes("duplicate") ? "Email or username already exists." : message, message.includes("duplicate") ? 409 : 500);
  }

  const stats = await loadProfileStats(supabase, user.id);
  const token = await signAuthToken({ sub: user.id, email: user.email, username: user.username });
  const loginUrl = `${env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/`;
  const emailResult = await sendRegistrationEmail({
    to: user.email,
    username: user.username,
    loginUrl
  });

  return jsonSuccess({
    token,
    email_sent: emailResult.sent,
    user: {
      ...user,
      ...stats
    }
  }, { status: 201 });
}