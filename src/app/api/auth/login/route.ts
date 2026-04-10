import { NextRequest } from "next/server";
import { comparePassword, signAuthToken } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validators/auth";

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

  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError("Validation failed.", 422, parsed.error.flatten());
  }

  const identifier = parsed.data.identifier.toLowerCase();
  const lookupColumn = identifier.includes("@") ? "email" : "username";

  const { data: user, error } = await supabase
    .from("users")
    .select("id,email,username,password_hash,first_name,last_name,bio,avatar_url,website,location,last_login,created_at,updated_at")
    .eq(lookupColumn, lookupColumn === "email" ? identifier : parsed.data.identifier)
    .maybeSingle();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (!user) {
    return jsonError("Invalid credentials.", 401);
  }

  const passwordValid = await comparePassword(parsed.data.password, user.password_hash);

  if (!passwordValid) {
    return jsonError("Invalid credentials.", 401);
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    return jsonError(updateError.message, 500);
  }

  const stats = await loadProfileStats(supabase, user.id);
  const token = await signAuthToken({ sub: user.id, email: user.email, username: user.username });

  return jsonSuccess({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      bio: user.bio,
      avatar_url: user.avatar_url,
      website: user.website,
      location: user.location,
      last_login: new Date().toISOString(),
      created_at: user.created_at,
      updated_at: user.updated_at,
      ...stats
    }
  });
}