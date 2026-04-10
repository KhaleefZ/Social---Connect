import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/http";
import { userSearchSchema } from "@/lib/validators/social";
import { loadPublicProfile } from "@/lib/profiles";

type UserPreview = Awaited<ReturnType<typeof loadPublicProfile>> & {
  preview_media_url: string | null;
  preview_media_type: "image" | "video" | null;
};

async function attachPreviewMedia(items: NonNullable<Awaited<ReturnType<typeof loadPublicProfile>>>[]) {
  const supabase = createSupabaseAdminClient();
  const authorIds = items.map((item) => item.id);

  const { data } = await supabase
    .from("posts")
    .select("author_id,media_url,media_type,created_at")
    .eq("is_active", true)
    .not("media_url", "is", null)
    .in("author_id", authorIds)
    .order("created_at", { ascending: false });

  const latestByAuthor = new Map<string, { media_url: string | null; media_type: "image" | "video" | null }>();

  (data ?? []).forEach((row) => {
    if (!latestByAuthor.has(row.author_id)) {
      latestByAuthor.set(row.author_id, {
        media_url: row.media_url,
        media_type: row.media_type as "image" | "video" | null
      });
    }
  });

  return items.map((item) => ({
    ...item,
    preview_media_url: latestByAuthor.get(item.id)?.media_url ?? null,
    preview_media_type: latestByAuthor.get(item.id)?.media_type ?? null
  }));
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = userSearchSchema.safeParse(params);

  if (!parsed.success) {
    return jsonError("Invalid pagination parameters.", 422, parsed.error.flatten());
  }

  const { page, limit, q, featured } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const supabase = createSupabaseAdminClient();

  let usersQuery = supabase
    .from("users")
    .select("id", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    usersQuery = usersQuery.or(`username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
  }

  if (featured) {
    usersQuery = usersQuery.limit(6);
  }

  const { data, error, count } = await usersQuery.range(from, to);

  if (error) {
    return jsonError(error.message, 500);
  }

  const profiles = await Promise.all((data ?? []).map((item) => loadPublicProfile(item.id)));
  const enrichedProfiles = await attachPreviewMedia(profiles.filter((profile): profile is NonNullable<typeof profile> => Boolean(profile)));

  return jsonSuccess({
    items: enrichedProfiles,
    page,
    limit,
    total: count ?? 0
  });
}