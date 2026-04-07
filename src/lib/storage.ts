import { env } from "@/lib/env";
import { createStorageFileName, validateImageUpload } from "@/lib/uploads";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type UploadResult =
  | {
      ok: true;
      url: string;
    }
  | {
      ok: false;
      error: string;
      status: number;
    };

export async function uploadImageFile(file: File, folder: "avatars" | "post-images"): Promise<UploadResult> {
  const target = folder === "avatars" ? "avatar" : "post-image";
  const validationError = validateImageUpload(file, target);

  if (validationError) {
    return {
      ok: false,
      error: validationError,
      status: 422 as const
    };
  }

  if (!env.SUPABASE_STORAGE_BUCKET) {
    return {
      ok: false,
      error: "SUPABASE_STORAGE_BUCKET is required for uploads.",
      status: 500 as const
    };
  }

  const supabase = createSupabaseAdminClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const filePath = createStorageFileName(folder, file.name);

  const { error } = await supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).upload(filePath, bytes, {
    contentType: file.type,
    upsert: false
  });

  if (error) {
    return {
      ok: false,
      error: error.message,
      status: 500 as const
    };
  }

  const { data } = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(filePath);

  return {
    ok: true,
    url: data.publicUrl
  };
}