import { NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/auth";
import { getBearerToken } from "@/lib/request";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/http";
import { loadPublicProfile } from "@/lib/profiles";
import { updateProfileSchema } from "@/lib/validators/profile";

export async function GET(request: NextRequest) {
  const token = getBearerToken(request);

  if (!token) {
    return jsonError("Authorization token is required.", 401);
  }

  try {
    const payload = await verifyAuthToken(token);
    const profile = await loadPublicProfile(payload.userId);
    const supabase = createSupabaseAdminClient();
    const { data: userDetails } = await supabase
      .from("users")
      .select("email,phone_number")
      .eq("id", payload.userId)
      .maybeSingle();

    if (!profile) {
      return jsonError("Profile not found.", 404);
    }

    return jsonSuccess({
      user: {
        ...profile,
        email: userDetails?.email ?? "",
        phone_number: userDetails?.phone_number ?? null
      }
    });
  } catch {
    return jsonError("Invalid token.", 401);
  }
}

export async function PATCH(request: NextRequest) {
  const token = getBearerToken(request);

  if (!token) {
    return jsonError("Authorization token is required.", 401);
  }

  let payload;

  try {
    payload = await verifyAuthToken(token);
  } catch {
    return jsonError("Invalid token.", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON payload.");
  }

  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Validation failed.", 422, parsed.error.flatten());
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .update(parsed.data)
    .eq("id", payload.userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Profile not found.", 404);
  }

  const profile = await loadPublicProfile(payload.userId);
  const { data: userDetails } = await supabase
    .from("users")
    .select("email,phone_number")
    .eq("id", payload.userId)
    .maybeSingle();

  return jsonSuccess({
    user: {
      ...profile,
      email: userDetails?.email ?? "",
      phone_number: userDetails?.phone_number ?? null
    }
  });
}