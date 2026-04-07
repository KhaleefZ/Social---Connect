import { NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function extractToken(request: NextRequest) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7);
}

export async function POST(request: NextRequest) {
  const token = extractToken(request);

  if (!token) {
    return jsonError("Authorization token is required.", 401);
  }

  let payload;

  try {
    payload = await verifyAuthToken(token);
  } catch {
    return jsonError("Invalid token.", 401);
  }

  const supabase = createSupabaseAdminClient();
  const expiration = payload.expiresAt > 0 ? new Date(payload.expiresAt * 1000).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("revoked_tokens").insert({
    jti: payload.tokenId,
    user_id: payload.userId,
    expires_at: expiration
  });

  if (error && !error.message.includes("duplicate")) {
    return jsonError(error.message, 500);
  }

  return jsonSuccess({ ok: true });
}