import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type PublicProfile = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  location: string | null;
  posts_count: number;
  followers_count: number;
  following_count: number;
  last_login: string | null;
  created_at: string;
  updated_at: string;
};

export async function loadPublicProfile(userId: string): Promise<PublicProfile | null> {
  const supabase = createSupabaseAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("id,username,first_name,last_name,bio,avatar_url,website,location,last_login,created_at,updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !user) {
    return null;
  }

  const [posts, followers, following] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user.id).eq("is_active", true),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", user.id)
  ]);

  return {
    ...user,
    posts_count: posts.count ?? 0,
    followers_count: followers.count ?? 0,
    following_count: following.count ?? 0
  };
}