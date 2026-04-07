import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function createSupabaseBrowserClient() {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error("Supabase browser credentials are required for client-side data access.");
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}