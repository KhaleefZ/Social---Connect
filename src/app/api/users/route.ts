import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/http";
import { paginationSchema } from "@/lib/validators/social";
import { loadPublicProfile } from "@/lib/profiles";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = paginationSchema.safeParse(params);

  if (!parsed.success) {
    return jsonError("Invalid pagination parameters.", 422, parsed.error.flatten());
  }

  const { page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const supabase = createSupabaseAdminClient();

  const { data, error, count } = await supabase
    .from("users")
    .select("id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return jsonError(error.message, 500);
  }

  const profiles = await Promise.all((data ?? []).map((item) => loadPublicProfile(item.id)));

  return jsonSuccess({
    items: profiles.filter((profile): profile is NonNullable<typeof profile> => Boolean(profile)),
    page,
    limit,
    total: count ?? 0
  });
}