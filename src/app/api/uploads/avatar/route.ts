import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/current-user";
import { jsonError, jsonSuccess } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { uploadImageFile } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request);

  if (!auth.user) {
    return jsonError(auth.error, auth.status);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("A file field is required.", 422);
  }

  const uploaded = await uploadImageFile(file, "avatars");

  if (!uploaded.ok) {
    return jsonError(uploaded.error, uploaded.status);
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("users").update({ avatar_url: uploaded.url }).eq("id", auth.user.userId);

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonSuccess({ avatar_url: uploaded.url }, { status: 201 });
}