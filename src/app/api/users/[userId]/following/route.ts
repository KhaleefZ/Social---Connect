import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/http";
import { loadPublicProfile } from "@/lib/profiles";
import { paginationSchema, userIdParamsSchema } from "@/lib/validators/social";

type RouteParams = {
  params: Promise<{ userId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const parsedParams = userIdParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return jsonError("Invalid user id.", 422, parsedParams.error.flatten());
  }

  const { userId } = parsedParams.data;
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = paginationSchema.safeParse(query);

  if (!parsed.success) {
    return jsonError("Invalid pagination parameters.", 422, parsed.error.flatten());
  }

  const { page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const supabase = createSupabaseAdminClient();

  const { data, error, count } = await supabase
    .from("follows")
    .select("following_id", { count: "exact" })
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return jsonError(error.message, 500);
  }

  const users = await Promise.all((data ?? []).map((row) => loadPublicProfile(row.following_id)));

  return jsonSuccess({
    items: users.filter((item): item is NonNullable<typeof item> => Boolean(item)),
    page,
    limit,
    total: count ?? 0
  });
}