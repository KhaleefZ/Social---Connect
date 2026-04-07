import { createStorageFileName, validatePostMediaUpload } from "@/lib/uploads";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export type PostMediaResult =
  | { ok: true; url: string; media_type: "image" | "video" }
  | { ok: false; error: string; status: number };

export async function uploadPostMediaFile(file: File): Promise<PostMediaResult> {
  const validationError = validatePostMediaUpload(file);

  if (validationError) {
    return { ok: false, error: validationError, status: 422 };
  }

  if (!env.SUPABASE_STORAGE_BUCKET) {
    return { ok: false, error: "SUPABASE_STORAGE_BUCKET is required for uploads.", status: 500 };
  }

  const supabase = createSupabaseAdminClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const filePath = createStorageFileName("post-media", file.name);
  const media_type = file.type.startsWith("video/") ? "video" : "image";

  const { error } = await supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).upload(filePath, bytes, {
    contentType: file.type,
    upsert: false
  });

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  const { data } = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(filePath);

  return { ok: true, url: data.publicUrl, media_type };
}