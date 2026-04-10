import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/current-user";
import { jsonError, jsonSuccess } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { loadPublicProfile } from "@/lib/profiles";

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request);

  if (!auth.user) {
    return jsonError(auth.error, auth.status);
  }

  const supabase = createSupabaseAdminClient();

  const [followingRes, followersRes] = await Promise.all([
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", auth.user.userId),
    supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", auth.user.userId)
  ]);

  if (followingRes.error) {
    return jsonError(followingRes.error.message, 500);
  }

  if (followersRes.error) {
    return jsonError(followersRes.error.message, 500);
  }

  const contactIds = Array.from(
    new Set([
      ...(followingRes.data ?? []).map((row) => row.following_id),
      ...(followersRes.data ?? []).map((row) => row.follower_id)
    ])
  );

  const contacts = await Promise.all(contactIds.map((id) => loadPublicProfile(id)));

  return jsonSuccess({
    items: contacts.filter((item): item is NonNullable<typeof item> => Boolean(item))
  });
}
