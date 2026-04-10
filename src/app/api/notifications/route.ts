import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/current-user";
import { jsonError, jsonSuccess } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request);

  if (!auth.user) {
    return jsonError(auth.error, auth.status);
  }

  const supabase = createSupabaseAdminClient();

  const [followingRes, ownPostsRes, followersRes] = await Promise.all([
    supabase.from("follows").select("following_id").eq("follower_id", auth.user.userId),
    supabase.from("posts").select("id").eq("author_id", auth.user.userId).eq("is_active", true),
    supabase.from("follows").select("follower_id,created_at").eq("following_id", auth.user.userId).order("created_at", { ascending: false }).limit(5)
  ]);

  if (followingRes.error) return jsonError(followingRes.error.message, 500);
  if (ownPostsRes.error) return jsonError(ownPostsRes.error.message, 500);
  if (followersRes.error) return jsonError(followersRes.error.message, 500);

  const followingIds = (followingRes.data ?? []).map((row) => row.following_id);
  const ownPostIds = (ownPostsRes.data ?? []).map((row) => row.id);

  const [postsByFollowing, commentsOnPosts, likesOnPosts] = await Promise.all([
    followingIds.length
      ? supabase
          .from("posts")
          .select("id,author_id,created_at,content")
          .eq("is_active", true)
          .in("author_id", followingIds)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], error: null }),
    ownPostIds.length
      ? supabase
          .from("comments")
          .select("id,post_id,author_id,created_at,content")
          .eq("is_active", true)
          .in("post_id", ownPostIds)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], error: null }),
    ownPostIds.length
      ? supabase
          .from("likes")
          .select("id,post_id,user_id,created_at")
          .in("post_id", ownPostIds)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], error: null })
  ]);

  const items = [
    ...(postsByFollowing.data ?? []).map((post) => ({
      id: `post-${post.id}`,
      title: "New post from someone you follow",
      subtitle: post.content.slice(0, 70),
      href: "/feed",
      created_at: post.created_at
    })),
    ...(followersRes.data ?? []).map((follower) => ({
      id: `follower-${follower.follower_id}-${follower.created_at}`,
      title: "New follower activity",
      subtitle: "Someone started following you.",
      href: "/me",
      created_at: follower.created_at
    })),
    ...(commentsOnPosts.data ?? []).map((comment) => ({
      id: `comment-${comment.id}`,
      title: "Comment on your post",
      subtitle: comment.content.slice(0, 70),
      href: `/posts/${comment.post_id}`,
      created_at: comment.created_at
    })),
    ...(likesOnPosts.data ?? []).map((like) => ({
      id: `like-${like.id}`,
      title: "Someone liked your post",
      subtitle: "Your post got a new like.",
      href: "/me",
      created_at: like.created_at
    }))
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return jsonSuccess({ items });
}
