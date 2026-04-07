import { NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/auth";
import { getBearerToken } from "@/lib/request";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function requireAuthenticatedUser(request: NextRequest) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      error: "Authorization token is required.",
      status: 401 as const
    };
  }

  try {
    const payload = await verifyAuthToken(token);

    if (payload.tokenId) {
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("revoked_tokens")
        .select("jti")
        .eq("jti", payload.tokenId)
        .maybeSingle();

      if (error) {
        return {
          error: error.message,
          status: 500 as const
        };
      }

      if (data) {
        return {
          error: "Token has been revoked.",
          status: 401 as const
        };
      }
    }

    return {
      user: payload
    };
  } catch {
    return {
      error: "Invalid token.",
      status: 401 as const
    };
  }
}